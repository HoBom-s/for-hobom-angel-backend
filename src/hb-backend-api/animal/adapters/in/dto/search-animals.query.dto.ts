import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSort } from "src/hb-backend-api/animal/domain/enums/animal-sort.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { PlacementType } from "src/hb-backend-api/animal/domain/enums/placement-type.enum";

export class SearchAnimalsQueryDto {
  @ApiPropertyOptional({ enum: AnimalSpecies })
  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @ApiPropertyOptional({ enum: AnimalSize })
  @IsOptional()
  @IsEnum(AnimalSize)
  size?: AnimalSize;

  @ApiPropertyOptional({ enum: AnimalSex })
  @IsOptional()
  @IsEnum(AnimalSex)
  sex?: AnimalSex;

  @ApiPropertyOptional({ enum: AnimalStatus })
  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus;

  @ApiPropertyOptional({
    enum: PlacementType,
    description: "신청 유형 필터: ADOPTION(입양) / FOSTER(임보). 생략 시 전체",
  })
  @IsOptional()
  @IsEnum(PlacementType)
  placement?: PlacementType;

  @ApiPropertyOptional({ description: "이름/설명 키워드" })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  keyword?: string;

  @ApiPropertyOptional({
    enum: AnimalSort,
    default: AnimalSort.LATEST,
    description: "정렬: LATEST(최신순, 기본) / OLDEST(오래된순)",
  })
  @IsOptional()
  @IsEnum(AnimalSort)
  sort?: AnimalSort;

  @ApiPropertyOptional({ description: "이전 페이지 마지막 항목의 커서" })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: "페이지 크기 (기본 20, 최대 50)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
