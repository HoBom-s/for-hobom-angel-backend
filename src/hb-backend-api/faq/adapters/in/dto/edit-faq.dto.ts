import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class EditFaqDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  question: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  answer: string;

  @ApiProperty({ description: "정렬 순서 (오름차순)" })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  order: number;
}
