import { ApiProperty } from "@nestjs/swagger";

export class PostMessageResponse {
  @ApiProperty()
  messageId: string;
}
