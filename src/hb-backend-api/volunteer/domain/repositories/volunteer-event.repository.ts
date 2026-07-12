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
  findByShelterId(shelterId: Types.ObjectId): Promise<VolunteerEventEntity[]>;
  /** OPEN events starting after `now`, soonest first (discovery). */
  findUpcoming(now: Date, limit: number): Promise<VolunteerEventEntity[]>;
}
