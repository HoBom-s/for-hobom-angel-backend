import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDate, IsOptional, ValidateNested } from "class-validator";
import { AnswerDto } from "src/hb-backend-api/questionnaire/adapters/in/dto/answer.dto";

export class SubmitFosterApplicationDto {
  @ApiPropertyOptional({ type: [AnswerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers?: AnswerDto[];

  @ApiPropertyOptional({ description: "종료 예정일 (ISO). 생략 시 무기한" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  plannedEndDate?: Date;
}
