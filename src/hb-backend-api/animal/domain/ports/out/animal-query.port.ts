import { Page } from "src/shared/pagination/page";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSort } from "src/hb-backend-api/animal/domain/enums/animal-sort.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

/** Discovery criteria: filters + a cursor page. */
export interface AnimalSearchCriteria {
  species?: AnimalSpecies;
  size?: AnimalSize;
  sex?: AnimalSex;
  status?: AnimalStatus;
  keyword?: string;
  cursor?: string;
  limit: number;
  sort: AnimalSort;
}

/** Read-side port. Returns hydrated {@link Animal} aggregates. */
export interface AnimalQueryPort {
  findById(id: AnimalId): Promise<Animal | null>;
  findByShelter(shelterId: ShelterId): Promise<Animal[]>;
  search(criteria: AnimalSearchCriteria): Promise<Page<Animal>>;
  /** Count a shelter's animals in any of the given statuses (for stats). */
  countByShelterAndStatuses(
    shelterId: ShelterId,
    statuses: AnimalStatus[],
  ): Promise<number>;
  /** Platform-wide count of animals in any of the given statuses (operator stats). */
  countByStatuses(statuses: AnimalStatus[]): Promise<number>;
}
