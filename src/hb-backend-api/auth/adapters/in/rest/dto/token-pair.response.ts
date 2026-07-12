import { ApiProperty } from "@nestjs/swagger";
import { TokenPair } from "src/hb-backend-api/auth/domain/model/token-pair";

export class TokenPairResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  public static from(pair: TokenPair): TokenPairResponse {
    const dto = new TokenPairResponse();
    dto.accessToken = pair.accessToken;
    dto.refreshToken = pair.refreshToken;
    return dto;
  }
}
