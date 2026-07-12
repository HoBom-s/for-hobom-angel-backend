import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

/** One survey answer. Values are always strings (a boolean as "true"/"false"). */
export class AnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  values: string[];
}
