import { Types } from "mongoose";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";

export type VolunteerEventMutablePatch = Partial<
  Pick<
    VolunteerEventEntity,
    "title" | "description" | "signedUpCount" | "status"
  >
>;

export interface VolunteerEventRepository {
  insert(doc: Partial<VolunteerEventEntity>): Promise<VolunteerEventEntity>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: VolunteerEventMutablePatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<VolunteerEventEntity | null>;
  findByIds(ids: Types.ObjectId[]): Promise<VolunteerEventEntity[]>;
  /** A shelter's events, keyset-paginated newest-first (returns up to limit+1). */
  findByShelterId(
    shelterId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerEventEntity[]>;
  /** OPEN events starting after `now`, soonest first (discovery). */
  findUpcoming(now: Date, limit: number): Promise<VolunteerEventEntity[]>;
  /** OPEN events whose end time has passed — candidates for auto-close. */
  findExpiredOpen(now: Date, limit: number): Promise<VolunteerEventEntity[]>;
}
