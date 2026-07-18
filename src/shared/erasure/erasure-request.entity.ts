import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { ErasureRequestStatus } from "src/shared/erasure/erasure-request-status.enum";
import { ErasureTaskStatus } from "src/shared/erasure/erasure-task-status.enum";

/** One per registered destroyer — the unit of resumable, idempotent progress. */
export interface ErasureTaskDoc {
  key: string;
  category: DataCategory;
  disposition: Disposition;
  priority: number;
  status: ErasureTaskStatus;
  affected: number;
  retained: number;
  attempts: number;
  note?: string | null;
  lastError?: string | null;
}

/**
 * A subject-erasure request and its per-category tasks. Progress lives here (as
 * domain state, not generic batch metadata), so a crash resumes from the first
 * non-DONE task and each category commits atomically with its own task marker.
 */
@Schema({ collection: "erasure_requests", timestamps: true })
export class ErasureRequestEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public subjectId: Types.ObjectId;

  // Null for a system-initiated purge (the daily 3am retention sweep).
  @Prop({ type: Types.ObjectId, ref: "users", default: null })
  public actorId?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  public reason?: string | null;

  @Prop({ required: true, enum: ErasureRequestStatus, type: String })
  public status: ErasureRequestStatus;

  @Prop({ type: Date, default: null })
  public quarantineUntil?: Date | null;

  @Prop({
    type: [
      {
        key: { type: String, required: true },
        category: { type: String, enum: DataCategory, required: true },
        disposition: { type: String, enum: Disposition, required: true },
        priority: { type: Number, required: true },
        status: { type: String, enum: ErasureTaskStatus, required: true },
        affected: { type: Number, default: 0 },
        retained: { type: Number, default: 0 },
        attempts: { type: Number, default: 0 },
        note: { type: String, default: null },
        lastError: { type: String, default: null },
      },
    ],
    default: [],
  })
  public tasks: ErasureTaskDoc[];

  @Prop({ type: Date, default: null })
  public completedAt?: Date | null;

  @Prop({ type: String, default: null })
  public lastError?: string | null;

  @Prop({ required: true, default: 0 })
  public version: number;
}
