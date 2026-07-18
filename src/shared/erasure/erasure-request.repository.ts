import { Types } from "mongoose";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { ErasureRequestEntity } from "src/shared/erasure/erasure-request.entity";
import { ErasureRequestStatus } from "src/shared/erasure/erasure-request-status.enum";
import { ErasureTaskStatus } from "src/shared/erasure/erasure-task-status.enum";

export interface CreateErasureTask {
  key: string;
  category: DataCategory;
  disposition: Disposition;
  priority: number;
}

export interface CreateErasureRequest {
  subjectId: Types.ObjectId;
  actorId: Types.ObjectId | null;
  reason: string | null;
  status: ErasureRequestStatus;
  quarantineUntil: Date | null;
  tasks: CreateErasureTask[];
}

export interface TaskOutcome {
  status: ErasureTaskStatus;
  affected: number;
  retained: number;
  note?: string | null;
  lastError?: string | null;
}

/**
 * Persistence for erasure requests. All writes use the ambient Mongo session
 * ({@link MongoSessionContext}): {@link recordTask} runs inside a per-task
 * transaction (so a category's data change and its task marker commit together);
 * the others run outside a transaction.
 */
export interface ErasureRequestRepository {
  create(doc: CreateErasureRequest): Promise<ErasureRequestEntity>;
  findById(id: Types.ObjectId): Promise<ErasureRequestEntity | null>;
  /** A subject's erasure requests, newest first (operator lookup). */
  findBySubject(subjectId: Types.ObjectId): Promise<ErasureRequestEntity[]>;
  markInProgress(id: Types.ObjectId): Promise<void>;
  /** Upsert the outcome of one task (matched by key); bumps its attempt count. */
  recordTask(
    id: Types.ObjectId,
    key: string,
    outcome: TaskOutcome,
  ): Promise<void>;
  finalize(
    id: Types.ObjectId,
    status: ErasureRequestStatus,
    completedAt: Date | null,
    lastError: string | null,
  ): Promise<void>;
}
