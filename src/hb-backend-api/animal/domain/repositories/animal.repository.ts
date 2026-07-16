import { Types } from "mongoose";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSort } from "src/hb-backend-api/animal/domain/enums/animal-sort.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";

/** Discovery filters. Absent fields are unconstrained. */
export interface AnimalSearchFilter {
  species?: AnimalSpecies;
  size?: AnimalSize;
  sex?: AnimalSex;
  status?: AnimalStatus;
  /** Matched against name/description. */
  keyword?: string;
}

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
    | "blinded"
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
  countByShelterAndStatuses(
    shelterId: Types.ObjectId,
    statuses: AnimalStatus[],
  ): Promise<number>;
  countByStatuses(statuses: AnimalStatus[]): Promise<number>;
  /**
   * Cursor search ordered by id (LATEST = desc, OLDEST = asc). Returns up to
   * `limit + 1` documents so the caller can tell whether another page exists;
   * `cursorId` is the id of the last item from the previous page (exclusive), or
   * null for the first page.
   */
  search(
    filter: AnimalSearchFilter,
    cursorId: Types.ObjectId | null,
    limit: number,
    sort: AnimalSort,
  ): Promise<AnimalEntity[]>;
}
