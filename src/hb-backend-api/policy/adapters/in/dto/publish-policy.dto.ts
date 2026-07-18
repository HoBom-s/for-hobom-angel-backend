import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

export class PublishPolicyDto {
  @ApiProperty({ enum: PolicyType })
  @IsEnum(PolicyType)
  public type: PolicyType;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  public title: string;

  @ApiProperty({ description: "정책 본문 (마크다운/HTML)" })
  @IsString()
  @MinLength(1)
  public content: string;

  @ApiPropertyOptional({
    description: "효력 발생일 (ISO-8601); 기본은 게시 시점",
  })
  @IsOptional()
  @IsISO8601()
  public effectiveDate?: string;
}
