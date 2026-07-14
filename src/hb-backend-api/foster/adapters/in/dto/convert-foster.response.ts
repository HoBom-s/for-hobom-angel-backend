import { ApiProperty } from "@nestjs/swagger";

export class ConvertFosterResponse {
  @ApiProperty({ description: "생성된 입양(APPROVED) id" })
  adoptionId: string;
}
