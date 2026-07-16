import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { PostBlockType } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";

export class PostBlockDto {
  @ApiProperty({ enum: PostBlockType })
  @IsEnum(PostBlockType)
  type: PostBlockType;

  @ApiPropertyOptional({ description: "TEXT 블록의 본문" })
  @ValidateIf((b: PostBlockDto) => b.type === PostBlockType.TEXT)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text?: string;

  @ApiPropertyOptional({ description: "IMAGE 블록의 object key" })
  @ValidateIf((b: PostBlockDto) => b.type === PostBlockType.IMAGE)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  imageKey?: string;

  @ApiPropertyOptional({ description: "IMAGE 블록의 캡션" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}

export class CreateVolunteerPostDto {
  @ApiProperty({ description: "후기 대상 보호소 ID" })
  @IsMongoId()
  shelterId: string;

  @ApiPropertyOptional({ description: "후기를 남길 봉사 일정 ID (선택)" })
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiProperty({
    type: [PostBlockDto],
    description: "본문 블록 (텍스트/이미지 순서대로)",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PostBlockDto)
  content: PostBlockDto[];
}
