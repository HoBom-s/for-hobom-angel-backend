import { ApiProperty } from "@nestjs/swagger";

export class SubmitReportResponse {
  @ApiProperty()
  reportId: string;
}
