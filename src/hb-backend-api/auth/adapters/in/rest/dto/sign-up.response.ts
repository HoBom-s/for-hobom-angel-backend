import { ApiProperty } from "@nestjs/swagger";
import { SignUpResult } from "src/hb-backend-api/auth/domain/ports/in/sign-up.use-case";
import { TokenPairResponse } from "src/hb-backend-api/auth/adapters/in/rest/dto/token-pair.response";

export class SignUpResponse {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ type: TokenPairResponse })
  tokens: TokenPairResponse;

  public static from(result: SignUpResult): SignUpResponse {
    const dto = new SignUpResponse();
    dto.userId = result.userId;
    dto.nickname = result.nickname;
    dto.tokens = TokenPairResponse.from(result.tokens);
    return dto;
  }
}
