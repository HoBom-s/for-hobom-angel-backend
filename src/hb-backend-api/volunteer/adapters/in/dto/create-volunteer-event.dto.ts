import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateVolunteerEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty({ description: "시작 시각 (ISO)" })
  @Type(() => Date)
  @IsDate()
  startAt: Date;

  @ApiProperty({ description: "종료 시각 (ISO)" })
  @Type(() => Date)
  @IsDate()
  endAt: Date;

  @ApiProperty({ description: "모집 인원" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity: number;
}
