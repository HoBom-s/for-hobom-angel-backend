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
    await this.repo.markInProgress(requestId);
    const request = await this.repo.findById(requestId);
    if (!request) {
      throw new Error("파기 요청을 찾을 수 없어요.");
    }

    const ctx = ErasureContext.of(command.actorId, command.reason ?? null);
    const ordered = [...request.tasks].sort((a, b) => a.priority - b.priority);

    for (const task of ordered) {
      if (task.status === ErasureTaskStatus.DONE) {
        continue; // resume-safe: already erased
      }
      try {
        await this.runTask(requestId, command.subjectId, task.key, ctx);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.repo.recordTask(requestId, task.key, {
          status: ErasureTaskStatus.FAILED,
          affected: 0,
          retained: 0,
          lastError: message,
        });
        await this.repo.finalize(
          requestId,
          ErasureRequestStatus.FAILED,
          null,
          message,
        );
        this.metrics.recordFailure();
        this.logger.error(
          `Erasure ${requestId.toString()} failed at ${task.key}: ${message}`,
        );
        throw error;
      }
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

    await this.repo.finalize(
      requestId,
      ErasureRequestStatus.COMPLETED,
      new Date(),
      null,
    );
    this.metrics.recordCompletion();

    const finalized = await this.repo.findById(requestId);
    return finalized ?? request;
  }

  /**
   * One category's disposition + its task marker, in a single bounded tx. If the
   * destroyer throws, the whole task rolls back (no partial erasure) and the
   * caller records the FAILED marker outside the aborted transaction.
   */
  @Transactional()
  private async runTask(
    requestId: Types.ObjectId,
    subjectId: string,
    key: string,
    ctx: ErasureContext,
  ): Promise<void> {
    const receipt = await this.registry.byKey(key).erase(subjectId, ctx);
    await this.repo.recordTask(requestId, key, {
      status: ErasureTaskStatus.DONE,
      affected: receipt.affected,
      retained: receipt.retained,
      note: receipt.note,
    });
  }
}
