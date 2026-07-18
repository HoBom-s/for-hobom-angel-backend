import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class SearchSheltersQueryDto {
  @ApiPropertyOptional({ description: "지역(시/도) 필터" })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: "보호소 이름 검색 (부분 일치)" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ description: "다음 페이지 커서" })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, description: "페이지 크기 (1~50)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
