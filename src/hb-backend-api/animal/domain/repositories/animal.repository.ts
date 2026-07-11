import { Types } from "mongoose";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";

/** Mutable fields the aggregate can change after registration. */
export type AnimalMutablePatch = Partial<
  Pick<
    AnimalEntity,
    | "name"
    | "species"
    | "description"
    | "traits"
    | "health"
    | "photos"
    | "status"
  >
>;

/** Persistence contract over the animals collection. */
export interface AnimalRepository {
  insert(doc: Partial<AnimalEntity>): Promise<AnimalEntity>;
  /** Version-guarded update; throws OptimisticLockException on a stale version. */
  update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: AnimalMutablePatch,
  ): Promise<void>;
  findById(id: Types.ObjectId): Promise<AnimalEntity | null>;
  findByShelterId(shelterId: Types.ObjectId): Promise<AnimalEntity[]>;
}
