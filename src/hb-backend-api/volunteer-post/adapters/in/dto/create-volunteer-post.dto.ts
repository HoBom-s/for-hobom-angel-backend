import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMaxSize,
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateVolunteerPostDto {
  @ApiPropertyOptional({ description: "후기를 남길 봉사 일정 ID (선택)" })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiProperty({ description: "후기 내용" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;

  @ApiPropertyOptional({
    type: [String],
    description: "이미지 object key 목록",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  imageKeys?: string[];
}
