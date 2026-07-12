import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { FacilityPhotoKind } from "src/hb-backend-api/shelter/domain/enums/facility-photo-kind.enum";

class AddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  roadAddress: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ enum: AddressVisibility })
  @IsEnum(AddressVisibility)
  visibility: AddressVisibility;
}

class FacilityPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  objectKey: string;

  @ApiProperty({ enum: FacilityPhotoKind })
  @IsEnum(FacilityPhotoKind)
  kind: FacilityPhotoKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}

export class RegisterShelterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: "3~40자 소문자/숫자/하이픈" })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiPropertyOptional({ description: "보호센터등록번호" })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ description: "사업자/고유번호 10자리" })
  @IsOptional()
  @IsString()
  businessNumber?: string;

  @ApiPropertyOptional({ type: [FacilityPhotoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacilityPhotoDto)
  facilityPhotos?: FacilityPhotoDto[];
}
