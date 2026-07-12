import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import {
  HealthDto,
  TraitsDto,
} from "src/hb-backend-api/animal/adapters/in/dto/register-animal.dto";

export class UpdateAnimalProfileDto {
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
}
