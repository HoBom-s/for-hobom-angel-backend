import { Types } from "mongoose";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureEngine } from "src/shared/erasure/erasure-engine";
import { ErasureRequestStatus } from "src/shared/erasure/erasure-request-status.enum";
import { ErasureTaskStatus } from "src/shared/erasure/erasure-task-status.enum";
import { Reconciler } from "src/shared/erasure/reconciler";

class FakeDestroyer extends Destroyer {
  public erasedTimes = 0;
  public readonly rule;
  constructor(
    public readonly key: string,
    public readonly priority: number,
    category: DataCategory,
    private readonly affected: number,
    private readonly residual = 0,
  ) {
    super();
    this.rule = {
      category,
      disposition: Disposition.HARD_DELETE,
      legalBasis: "test",
    };
  }
  protected doErase(): Promise<DisposalResult> {
    this.erasedTimes += 1;
    return Promise.resolve({ affected: this.affected, retained: 0 });
  }
  public verifyResidual(): Promise<number> {
    return Promise.resolve(this.residual);
  }
}

class FakeRepo {
  public request: Record<string, unknown> | null = null;
  create(doc: {
    subjectId: Types.ObjectId;
    actorId: Types.ObjectId | null;
    reason: string | null;
    status: ErasureRequestStatus;
    tasks: {
      key: string;
      category: string;
      disposition: string;
      priority: number;
    }[];
  }): Promise<Record<string, unknown>> {
    this.request = {
      _id: new Types.ObjectId(),
      subjectId: doc.subjectId,
      actorId: doc.actorId,
      reason: doc.reason,
      status: doc.status,
      tasks: doc.tasks.map((t) => ({
        ...t,
        status: ErasureTaskStatus.PENDING,
        affected: 0,
        retained: 0,
        attempts: 0,
      })),
      completedAt: null,
      createdAt: new Date(0),
    };
    return Promise.resolve(this.request);
  }
  findById(): Promise<Record<string, unknown> | null> {
    return Promise.resolve(this.request);
  }
  markInProgress(): Promise<void> {
    this.request!.status = ErasureRequestStatus.IN_PROGRESS;
    return Promise.resolve();
  }
  recordTask(
    _id: Types.ObjectId,
    key: string,
    outcome: { status: ErasureTaskStatus; affected: number; retained: number },
  ): Promise<void> {
    const tasks = this.request!.tasks as Record<string, unknown>[];
    const task = tasks.find((t) => t.key === key)!;
    task.status = outcome.status;
    task.affected = outcome.affected;
    task.retained = outcome.retained;
    task.attempts = (task.attempts as number) + 1;
    return Promise.resolve();
  }
  finalize(
    _id: Types.ObjectId,
    status: ErasureRequestStatus,
    completedAt: Date | null,
  ): Promise<void> {
    this.request!.status = status;
    this.request!.completedAt = completedAt;
    return Promise.resolve();
  }
}

describe("ErasureEngine", () => {
  const txRunner = {
    run: (fn: () => Promise<unknown>) => fn(),
  } as unknown as TransactionRunner;

  const build = (destroyers: FakeDestroyer[]) => {
    const registry = new DestroyerRegistry();
    destroyers.forEach((d) => registry.register(d));
    const reconciler = new Reconciler(registry);
    const metrics = { recordCompletion: jest.fn(), recordFailure: jest.fn() };
    const audit = { record: jest.fn() };
    const repo = new FakeRepo();
    const engine = new ErasureEngine(
      txRunner,
      registry,
      reconciler,
      metrics as never,
      repo as never,
      audit,
    );
    return { engine, metrics, audit, repo };
  };

  const cmd = () => ({
    actorId: new Types.ObjectId().toString(),
    subjectId: new Types.ObjectId().toString(),
  });

  it("runs every destroyer, records DELETE_PII, and completes clean", async () => {
    const identity = new FakeDestroyer("id", 100, DataCategory.IDENTITY, 1);
    const creds = new FakeDestroyer("cr", 10, DataCategory.CREDENTIALS, 2);
    const { engine, metrics, audit, repo } = build([identity, creds]);

    const result = await engine.erase(cmd());

    expect(result.status).toBe(ErasureRequestStatus.COMPLETED);
    expect(identity.erasedTimes).toBe(1);
    expect(creds.erasedTimes).toBe(1);
    expect(audit.record).toHaveBeenCalledTimes(1);
    expect(metrics.recordCompletion).toHaveBeenCalledTimes(1);
    const tasks = repo.request!.tasks as { status: ErasureTaskStatus }[];
    expect(tasks.every((t) => t.status === ErasureTaskStatus.DONE)).toBe(true);
  });

  it("fails and records a failure when residual PII remains", async () => {
    const leaky = new FakeDestroyer("leak", 1, DataCategory.SOCIAL, 1, 2);
    const { engine, metrics, repo } = build([leaky]);

    await expect(engine.erase(cmd())).rejects.toThrow("잔존");
    expect(metrics.recordFailure).toHaveBeenCalledTimes(1);
    expect(repo.request!.status).toBe(ErasureRequestStatus.FAILED);
  });
});
