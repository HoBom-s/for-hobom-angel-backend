import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * §07 About editor. Every field is optional — omitted fields keep their current
 * value, an empty string clears one. Text fields are author-written Markdown
 * (client renders + sanitizes); `coverImageKey` is an object key already
 * uploaded via the media presign flow.
 */
export class EditShelterProfileDto {
  @ApiPropertyOptional({ description: "소개 (Markdown)" })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  intro?: string;

  @ApiPropertyOptional({ description: "운영 시작일 (ISO)" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  operatingSince?: Date;

  @ApiPropertyOptional({ description: "대표자명" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  representativeName?: string;

  @ApiPropertyOptional({ description: "방문 안내 (Markdown)" })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  visitGuide?: string;

  @ApiPropertyOptional({ description: "후원 안내 (Markdown)" })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  supportGuide?: string;

  @ApiPropertyOptional({ description: "커버(히어로) 이미지 object key" })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  coverImageKey?: string;
}
