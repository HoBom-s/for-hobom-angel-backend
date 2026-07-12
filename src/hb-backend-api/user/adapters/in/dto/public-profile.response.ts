import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/hb-backend-api/user/domain/model/user";

/** A member as seen by others: only the public display name is disclosed. */
export class PublicProfileResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nickname: string;

  public static from(user: User): PublicProfileResponse {
    const dto = new PublicProfileResponse();
    dto.id = user.getId.toString();
    dto.nickname = user.getNickname.raw;
    return dto;
  }
}
