import { ApiProperty } from "@nestjs/swagger";

export class UnreadCountResponse {
  @ApiProperty({ description: "안 읽은 알림 수 (벨 뱃지)" })
  count: number;

  public static of(count: number): UnreadCountResponse {
    const dto = new UnreadCountResponse();
    dto.count = count;
    return dto;
  }
}
