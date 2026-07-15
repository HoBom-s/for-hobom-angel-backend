import { ApiProperty } from "@nestjs/swagger";

/**
 * Body returned by signup/login. Tokens are NOT here — they are set as httpOnly
 * cookies. `userId` is the stable identity the client keys off (nickname is
 * mutable, so it is not used as an identifier).
 */
export class SessionResponse {
  @ApiProperty()
  userId: string;

  public static of(userId: string): SessionResponse {
    const dto = new SessionResponse();
    dto.userId = userId;
    return dto;
  }
}
