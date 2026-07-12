import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import {
  PlacementEligibilityPort,
  PlacementRecord,
} from "src/hb-backend-api/review/domain/ports/out/placement-eligibility.port";

/**
 * Resolves a placement from the adoption/foster side. A placement "completed"
 * once its application reached APPROVED — that is what earns the reviewer their
 * first-hand experience of the shelter.
 */
@Injectable()
export class PlacementEligibilityAdapter implements PlacementEligibilityPort {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly adoptionQueryPort: AdoptionApplicationQueryPort,
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly fosterQueryPort: FosterApplicationQueryPort,
  ) {}

  public async find(
    placementType: PlacementType,
    placementRef: string,
  ): Promise<PlacementRecord | null> {
    return placementType === PlacementType.ADOPTION
      ? this.findAdoption(placementRef)
      : this.findFoster(placementRef);
  }

  private async findAdoption(ref: string): Promise<PlacementRecord | null> {
    const application = await this.adoptionQueryPort.findById(
      ApplicationId.fromString(ref),
    );
    if (!application) {
      return null;
    }
    return {
      shelterId: application.getShelterId.toString(),
      adopterId: application.getApplicantId.toString(),
      completed: application.getStatus === AdoptionApplicationStatus.APPROVED,
    };
  }

  private async findFoster(ref: string): Promise<PlacementRecord | null> {
    const application = await this.fosterQueryPort.findById(
      FosterApplicationId.fromString(ref),
    );
    if (!application) {
      return null;
    }
    return {
      shelterId: application.getShelterId.toString(),
      adopterId: application.getApplicantId.toString(),
      completed: application.getStatus === FosterApplicationStatus.APPROVED,
    };
  }
}
