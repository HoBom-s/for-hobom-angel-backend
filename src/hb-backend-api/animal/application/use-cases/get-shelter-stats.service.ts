import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import {
  GetShelterStatsUseCase,
  ShelterStats,
} from "src/hb-backend-api/animal/domain/ports/in/get-shelter-stats.use-case";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

const SHELTERED_STATUSES = [
  AnimalStatus.AVAILABLE,
  AnimalStatus.RESERVED,
  AnimalStatus.FOSTERED,
];

@Injectable()
export class GetShelterStatsService implements GetShelterStatsUseCase {
  constructor(
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
  ) {}

  public async invoke(shelterId: string): Promise<ShelterStats> {
    const id = ShelterId.fromString(shelterId);
    const [adoptedCount, shelteredCount, availableCount] = await Promise.all([
      this.animalQueryPort.countByShelterAndStatuses(id, [
        AnimalStatus.ADOPTED,
      ]),
      this.animalQueryPort.countByShelterAndStatuses(id, SHELTERED_STATUSES),
      this.animalQueryPort.countByShelterAndStatuses(id, [
        AnimalStatus.AVAILABLE,
      ]),
    ]);
    return { adoptedCount, shelteredCount, availableCount };
  }
}
