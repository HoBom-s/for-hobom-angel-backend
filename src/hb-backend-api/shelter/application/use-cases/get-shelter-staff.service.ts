import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  GetShelterStaffQuery,
  GetShelterStaffUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/get-shelter-staff.use-case";

/**
 * Returns a shelter's staff roster for its own staff to manage. Membership lives
 * on the User aggregate (its shelter-role grants), so this is a reverse lookup by
 * shelter. Only members who can manage the shelter may read it. The roster is
 * bounded — a shelter has at most a handful of staff — so it returns a plain
 * capped list, no cursor.
 */
@Injectable()
export class GetShelterStaffService implements GetShelterStaffUseCase {
  private static readonly MAX_ROSTER = 200;

  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(query: GetShelterStaffQuery): Promise<User[]> {
    const shelterId = ShelterId.fromString(query.shelterId);
    const actor = await this.userQueryPort.findById(
      UserId.fromString(query.actorId),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException(
        "보호소 담당자만 스태프 목록을 볼 수 있어요.",
      );
    }
    return this.userQueryPort.findByShelter(
      shelterId,
      GetShelterStaffService.MAX_ROSTER,
    );
  }
}
