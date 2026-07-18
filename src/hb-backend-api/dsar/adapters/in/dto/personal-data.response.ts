import { ApiProperty } from "@nestjs/swagger";
import { PersonalData } from "src/hb-backend-api/user/domain/model/personal-data";

/** DSAR access payload — decrypted identity/profile PII. */
export class PersonalDataResponse {
  @ApiProperty()
  public userId: string;

  @ApiProperty()
  public email: string;

  @ApiProperty()
  public nickname: string;

  @ApiProperty()
  public realName: string;

  @ApiProperty()
  public phone: string;

  @ApiProperty({ type: [String] })
  public roles: string[];

  @ApiProperty()
  public status: string;

  @ApiProperty({ type: Date, nullable: true })
  public createdAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  public withdrawnAt: Date | null;

  public static from(data: PersonalData): PersonalDataResponse {
    const response = new PersonalDataResponse();
    response.userId = data.userId;
    response.email = data.email;
    response.nickname = data.nickname;
    response.realName = data.realName;
    response.phone = data.phone;
    response.roles = data.roles;
    response.status = data.status;
    response.createdAt = data.createdAt;
    response.withdrawnAt = data.withdrawnAt;
    return response;
  }
}
