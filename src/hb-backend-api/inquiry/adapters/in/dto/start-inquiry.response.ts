import { ApiProperty } from "@nestjs/swagger";

export class StartInquiryResponse {
  @ApiProperty({
    description: "문의 스레드 id (메시지는 /conversations/INQUIRY/:id)",
  })
  inquiryId: string;
}
