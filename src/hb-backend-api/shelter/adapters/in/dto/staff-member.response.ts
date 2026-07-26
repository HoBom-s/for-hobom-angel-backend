import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { User } from "src/hb-backend-api/user/domain/model/user";

/** One roster member: who they are and the role(s) they hold at this shelter. */
export class StaffMemberResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({
    enum: UserRole,
    isArray: true,
    description: "이 보호소에서 가진 역할 (STAFF/ADMIN)",
  })
  roles: UserRole[];

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  public static from(user: User, shelterId: ShelterId): StaffMemberResponse {
    const dto = new StaffMemberResponse();
    dto.id = user.getId.toString();
    dto.nickname = user.getNickname.raw;
    dto.roles = user.getShelterRoles
      .filter((grant) => grant.isFor(shelterId))
      .map((grant) => grant.getRole);
    dto.status = user.getStatus;
    return dto;
  }
}
