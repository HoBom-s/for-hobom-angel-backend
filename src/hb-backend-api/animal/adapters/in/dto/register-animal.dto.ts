import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";

export class TraitsDto {
  @ApiProperty({ enum: AnimalSex })
  @IsEnum(AnimalSex)
  sex: AnimalSex;

  @ApiProperty({ enum: AnimalSize })
  @IsEnum(AnimalSize)
  size: AnimalSize;

  @ApiPropertyOptional({ description: "추정 나이(개월)" })
  @IsOptional()
  @IsInt()
  @Min(0)
  ageMonths?: number;

  @ApiPropertyOptional({ description: "몸무게(kg), 소수 허용" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personality?: string;
}

export class HealthDto {
  @ApiProperty()
  @IsBoolean()
  neutered: boolean;

  @ApiProperty()
  @IsBoolean()
  vaccinated: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  microchipId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

class IntakeDto {
  @ApiProperty({ description: "입소일 (ISO)" })
  @Type(() => Date)
  @IsDate()
  intakeDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rescueStory?: string;

  @ApiPropertyOptional({ description: "유기동물 공고번호" })
  @IsOptional()
  @IsString()
  noticeNumber?: string;
}

class AnimalPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  objectKey: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}

export class RegisterAnimalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiProperty({ enum: AnimalSpecies })
  @IsEnum(AnimalSpecies)
  species: AnimalSpecies;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ type: TraitsDto })
  @ValidateNested()
  @Type(() => TraitsDto)
  traits: TraitsDto;

  @ApiProperty({ type: HealthDto })
  @ValidateNested()
  @Type(() => HealthDto)
  health: HealthDto;

  @ApiProperty({ type: IntakeDto })
  @ValidateNested()
  @Type(() => IntakeDto)
  intake: IntakeDto;

  @ApiPropertyOptional({ type: [AnimalPhotoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnimalPhotoDto)
  photos?: AnimalPhotoDto[];
}
