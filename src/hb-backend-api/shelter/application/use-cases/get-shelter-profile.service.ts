import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import {
  GetShelterProfileQuery,
  GetShelterProfileUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/get-shelter-profile.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Returns a shelter's editable profile to its own staff (the same authority that
 * may edit it via {@link EditShelterProfileUseCase}), so the console can prefill
 * the "소개" editor by shelter id.
 */
@Injectable()
export class GetShelterProfileService implements GetShelterProfileUseCase {
  constructor(
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(query: GetShelterProfileQuery): Promise<Shelter> {
    const shelterId = ShelterId.fromString(query.shelterId);

    const actor = await this.userQueryPort.findById(
      UserId.fromString(query.actorId),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 스태프만 소개를 볼 수 있어요.");
    }

    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }
    return shelter;
  }
}
