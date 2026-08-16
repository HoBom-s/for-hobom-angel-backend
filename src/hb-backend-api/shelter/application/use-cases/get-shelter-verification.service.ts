import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import {
  GetShelterVerificationQuery,
  GetShelterVerificationUseCase,
  ShelterVerificationView,
} from "src/hb-backend-api/shelter/domain/ports/in/get-shelter-verification.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Returns a shelter's verification dossier to an operator. Only a SYSTEM_ADMIN
 * may read it (the same authority that decides the verification). The registrant
 * (first representative) is resolved to a nickname for display.
 */
@Injectable()
export class GetShelterVerificationService implements GetShelterVerificationUseCase {
  constructor(
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: GetShelterVerificationQuery,
  ): Promise<ShelterVerificationView> {
    const viewer = await this.userQueryPort.findById(
      UserId.fromString(query.viewerId),
    );
    if (!viewer || !viewer.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 보호소 검증 정보를 볼 수 있어요.");
    }

    const shelter = await this.shelterQueryPort.findById(
      ShelterId.fromString(query.shelterId),
    );
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }

    const registrantId = shelter.getRepresentatives[0] ?? null;
    let registrant: ShelterVerificationView["registrant"] = null;
    if (registrantId) {
      const user = await this.userQueryPort.findById(registrantId);
      if (user) {
        registrant = {
          id: registrantId.toString(),
          nickname: user.getNickname.raw,
        };
      }
    }

    return { shelter, registrant };
  }
}
