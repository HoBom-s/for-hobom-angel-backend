import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { VolunteerType } from "src/hb-backend-api/volunteer/domain/enums/volunteer-type.enum";

export class TransportInputDto {
  @ApiProperty({ description: "출발지 (예: 인천)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  departure: string;

  @ApiProperty({ description: "도착지 (예: 밴쿠버)" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  arrival: string;

  @ApiProperty({ description: "항공편 시각 (ISO)" })
  @Type(() => Date)
  @IsDate()
  flightAt: Date;

  @ApiProperty({
    description: "동반 동물 ID 목록 (보호소 소속 동물)",
    type: [String],
  })
  @IsArray()
  @ArrayMaxSize(50)
  @IsMongoId({ each: true })
  animalIds: string[];

  @ApiPropertyOptional({ description: "지원 자격 안내" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  qualification?: string;
}

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

  @ApiPropertyOptional({
    enum: VolunteerType,
    default: VolunteerType.GENERAL,
    description: "봉사 유형 (기본 GENERAL)",
  })
  @IsOptional()
  @IsEnum(VolunteerType)
  type?: VolunteerType;

  @ApiPropertyOptional({
    type: TransportInputDto,
    description: "OVERSEAS(해외 이동봉사)일 때 필수",
  })
  @ValidateIf(
    (dto: CreateVolunteerEventDto) => dto.type === VolunteerType.OVERSEAS,
  )
  @IsNotEmpty({ message: "해외 이동봉사는 이동 정보가 필요해요." })
  @ValidateNested()
  @Type(() => TransportInputDto)
  transport?: TransportInputDto;
}
