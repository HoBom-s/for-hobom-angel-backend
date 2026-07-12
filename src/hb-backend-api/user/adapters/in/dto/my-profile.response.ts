import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";

class ShelterRoleView {
  @ApiProperty()
  shelterId: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

/** The caller's own account view. No plaintext PII (real name / phone) is exposed. */
export class MyProfileResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: VerifiedChannel })
  verifiedChannel: VerifiedChannel;

  @ApiProperty({ enum: UserRole, isArray: true })
  roles: UserRole[];

  @ApiProperty({ type: [ShelterRoleView] })
  shelterRoles: ShelterRoleView[];

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  public static from(user: User): MyProfileResponse {
    const dto = new MyProfileResponse();
    dto.id = user.getId.toString();
    dto.nickname = user.getNickname.raw;
    dto.email = user.getEmail.raw;
    dto.verifiedChannel = user.getVerifiedChannel;
    dto.roles = user.getRoles;
    dto.shelterRoles = user.getShelterRoles.map((grant) => ({
      shelterId: grant.getShelterId.toString(),
      role: grant.getRole,
    }));
    dto.status = user.getStatus;
    return dto;
  }
}
