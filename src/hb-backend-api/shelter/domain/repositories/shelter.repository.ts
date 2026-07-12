import { Types } from "mongoose";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";

/** Mutable fields the aggregate can change after registration. */
export type ShelterMutablePatch = Partial<
  Pick<
    ShelterEntity,
    | "status"
    | "trustTier"
    | "verifiedAt"
    | "rejectionReason"
    | "representatives"
    | "facilityPhotos"
    | "verificationSignals"
  >
>;

/** Persistence contract over the shelters collection. */
export interface ShelterRepository {
  insert(doc: Partial<ShelterEntity>): Promise<ShelterEntity>;
  /**
   * Version-guarded update: applies `patch` (and bumps version) only if the
   * stored version still equals `expectedVersion`, else throws
   * {@link OptimisticLockException}.
   */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ShelterMutablePatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<ShelterEntity | null>;
  findBySlug(slug: string): Promise<ShelterEntity | null>;
  /** Verified, non-hidden shelters with coordinates; optionally by region. */
  findMappable(region?: string): Promise<ShelterEntity[]>;
}
