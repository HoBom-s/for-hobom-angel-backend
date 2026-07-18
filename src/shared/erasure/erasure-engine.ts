import { Inject, Injectable, Logger } from "@nestjs/common";
import { Types } from "mongoose";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditPersistencePort } from "src/hb-backend-api/audit/domain/ports/out/audit-persistence.port";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureContext } from "src/shared/erasure/erasure-context";
import { ErasureMetrics } from "src/shared/erasure/erasure-metrics";
import { ErasureRequestEntity } from "src/shared/erasure/erasure-request.entity";
import { ErasureRequestStatus } from "src/shared/erasure/erasure-request-status.enum";
import { ErasureTaskStatus } from "src/shared/erasure/erasure-task-status.enum";
import { ErasureRequestRepository } from "src/shared/erasure/erasure-request.repository";
import { Reconciler } from "src/shared/erasure/reconciler";

/** Actor recorded for a system-initiated (daily 3am) purge — no human operator. */
export const SYSTEM_ACTOR = "system";

export interface ErasureCommand {
  /** A user ObjectId string, or {@link SYSTEM_ACTOR} for the scheduled sweep. */
  actorId: string;
  subjectId: string;
  reason?: string | null;
}

/**
 * Owns the erasure lifecycle. A request fans out to one task per registered
 * {@link Destroyer}; each task runs in its OWN bounded transaction (the category's
 * data change commits atomically with its task marker) — never a single
 * transaction spanning every collection. Tasks are idempotent, so a DONE task is
 * skipped on resume and a re-run is safe. After all tasks complete, the
 * {@link Reconciler} asserts zero residual PII before the request is COMPLETED.
 *
 * PR1 executes synchronously (quarantine = 0); the cancelable quarantine window,
 * the cron worker, retries and the downstream SUBJECT_ERASED event land in PR2.
 */
@Injectable()
export class ErasureEngine {
  private readonly logger = new Logger(ErasureEngine.name);

  constructor(
    public readonly transactionRunner: TransactionRunner,
    private readonly registry: DestroyerRegistry,
    private readonly reconciler: Reconciler,
    private readonly metrics: ErasureMetrics,
    @Inject(DIToken.ErasureModule.ErasureRequestRepository)
    private readonly repo: ErasureRequestRepository,
    @Inject(DIToken.AuditModule.AuditPersistencePort)
    private readonly audit: AuditPersistencePort,
  ) {}

  /** Create the request + tasks, record intent, then run it to completion. */
  public async erase(command: ErasureCommand): Promise<ErasureRequestEntity> {
    const request = await this.createRequest(command);
    return this.execute(request._id, command);
  }

  /** Read an erasure request by id (for the status endpoint). */
  public getRequest(requestId: string): Promise<ErasureRequestEntity | null> {
    return this.repo.findById(new Types.ObjectId(requestId));
  }

  /** A subject's erasure requests, newest first (operator lookup). */
  public getRequestsBySubject(
    subjectId: string,
  ): Promise<ErasureRequestEntity[]> {
    return this.repo.findBySubject(new Types.ObjectId(subjectId));
  }

  @Transactional()
  private async createRequest(
    command: ErasureCommand,
  ): Promise<ErasureRequestEntity> {
    const request = await this.repo.create({
      subjectId: new Types.ObjectId(command.subjectId),
      actorId: Types.ObjectId.isValid(command.actorId)
        ? new Types.ObjectId(command.actorId)
        : null,
      reason: command.reason ?? null,
      status: ErasureRequestStatus.PENDING,
      quarantineUntil: null,
      tasks: this.registry.ordered().map((d) => ({
        key: d.key,
        category: d.rule.category,
        disposition: d.rule.disposition,
        priority: d.priority,
      })),
    });
    await this.audit.record(
      AuditEvent.of({
        action: AuditAction.DELETE_PII,
        actorId: command.actorId,
        subjectUserId: command.subjectId,
        reason: command.reason ?? null,
      }),
    );
    return request;
  }

  private async execute(
    requestId: Types.ObjectId,
    command: ErasureCommand,
  ): Promise<ErasureRequestEntity> {
    // One round trip: claim PENDING → IN_PROGRESS and read the tasks.
    const request = await this.repo.claimInProgress(requestId);
    if (!request) {
      throw new Error("파기 요청을 찾을 수 없어요.");
    }

    const ctx = ErasureContext.of(command.actorId, command.reason ?? null);
    const pending = [...request.tasks]
      .filter((task) => task.status !== ErasureTaskStatus.DONE)
      .sort((a, b) => a.priority - b.priority);

    // Bundle consecutive light categories into one transaction (fewer commits);
    // flush the bundle before each heavy category, which gets its own tx.
    let bundle: string[] = [];
    const flushBundle = async (): Promise<void> => {
      if (bundle.length === 0) {
        return;
      }
      const keys = bundle;
      bundle = [];
      this.markDoneInMemory(
        request,
        await this.runBundle(requestId, command.subjectId, keys, ctx),
      );
    };

    try {
      for (const task of pending) {
        if (this.registry.byKey(task.key).rule.heavy) {
          await flushBundle();
          this.markDoneInMemory(
            request,
            await this.runBundle(requestId, command.subjectId, [task.key], ctx),
          );
        } else {
          bundle.push(task.key);
        }
      }
      await flushBundle();
    } catch (error) {
      await this.fail(requestId, request, error);
      throw error;
    }

    const { clean, residual } = await this.reconciler.scan(command.subjectId);
    if (!clean) {
      const message = `잔존 PII ${residual}건 — 파기 검증 실패`;
      await this.repo.finalize(
        requestId,
        ErasureRequestStatus.FAILED,
        null,
        message,
      );
      this.metrics.recordFailure();
      throw new Error(message);
    }

    const completedAt = new Date();
    await this.repo.finalize(
      requestId,
      ErasureRequestStatus.COMPLETED,
      completedAt,
      null,
    );
    this.metrics.recordCompletion();

    // Return the in-memory request (mutated as tasks completed) — no re-read.
    request.status = ErasureRequestStatus.COMPLETED;
    request.completedAt = completedAt;
    return request;
  }

  /**
   * Runs one or more categories' dispositions + their task markers in a SINGLE
   * bounded transaction (all-or-nothing). A single-key bundle is how a heavy
   * category runs isolated. Returns per-key outcomes to sync the in-memory doc.
   */
  @Transactional()
  private async runBundle(
    requestId: Types.ObjectId,
    subjectId: string,
    keys: string[],
    ctx: ErasureContext,
  ): Promise<TaskOutcomeRef[]> {
    const outcomes: TaskOutcomeRef[] = [];
    for (const key of keys) {
      const receipt = await this.registry.byKey(key).erase(subjectId, ctx);
      await this.repo.recordTask(requestId, key, {
        status: ErasureTaskStatus.DONE,
        affected: receipt.affected,
        retained: receipt.retained,
        note: receipt.note,
      });
      outcomes.push({
        key,
        affected: receipt.affected,
        retained: receipt.retained,
      });
    }
    return outcomes;
  }

  private markDoneInMemory(
    request: ErasureRequestEntity,
    outcomes: TaskOutcomeRef[],
  ): void {
    for (const outcome of outcomes) {
      const task = request.tasks.find((t) => t.key === outcome.key);
      if (task) {
        task.status = ErasureTaskStatus.DONE;
        task.affected = outcome.affected;
        task.retained = outcome.retained;
      }
    }
  }

  private async fail(
    requestId: Types.ObjectId,
    request: ErasureRequestEntity,
    error: unknown,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    // Mark whatever hadn't committed as FAILED (outside the aborted tx).
    for (const task of request.tasks) {
      if (task.status !== ErasureTaskStatus.DONE) {
        await this.repo.recordTask(requestId, task.key, {
          status: ErasureTaskStatus.FAILED,
          affected: 0,
          retained: 0,
          lastError: message,
        });
      }
    }
    await this.repo.finalize(
      requestId,
      ErasureRequestStatus.FAILED,
      null,
      message,
    );
    this.metrics.recordFailure();
    this.logger.error(`Erasure ${requestId.toString()} failed: ${message}`);
  }
}

interface TaskOutcomeRef {
  key: string;
  affected: number;
  retained: number;
}
