import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsInt, Min } from "class-validator";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

export class GrantConsentDto {
  @ApiProperty({ enum: PolicyType })
  @IsEnum(PolicyType)
  public policyType: PolicyType;

  @ApiProperty({
    description: "동의하는 정책 버전 (현재 게시본과 일치해야 함)",
  })
  @IsInt()
  @Min(1)
  public policyVersion: number;
}
