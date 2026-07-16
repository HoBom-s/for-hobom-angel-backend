import { Types } from "mongoose";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";

export type VolunteerSignupMutablePatch = Partial<
  Pick<VolunteerSignupEntity, "status">
>;

export interface VolunteerSignupRepository {
  insert(doc: Partial<VolunteerSignupEntity>): Promise<VolunteerSignupEntity>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: VolunteerSignupMutablePatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<VolunteerSignupEntity | null>;
  findLive(
    eventId: Types.ObjectId,
    volunteerId: Types.ObjectId,
  ): Promise<VolunteerSignupEntity | null>;
  findByEvent(eventId: Types.ObjectId): Promise<VolunteerSignupEntity[]>;
  findLiveByVolunteer(
    volunteerId: Types.ObjectId,
    eventIds: Types.ObjectId[],
  ): Promise<VolunteerSignupEntity[]>;
  /**
   * A member's signups, newest first. Returns up to `limit + 1` docs;
   * `cursorId` is the previous page's last signup id (exclusive).
   */
  findByVolunteer(
    volunteerId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<VolunteerSignupEntity[]>;
}
