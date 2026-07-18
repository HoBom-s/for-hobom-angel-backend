import { ApiProperty } from "@nestjs/swagger";
import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";

/** A version-history entry (metadata only; body omitted to keep the list light). */
export class PolicyVersionResponse {
  @ApiProperty({ enum: PolicyType })
  public type: PolicyType;

  @ApiProperty()
  public version: number;

  @ApiProperty()
  public title: string;

  @ApiProperty({ enum: PolicyStatus })
  public status: PolicyStatus;

  @ApiProperty({ type: Date })
  public effectiveDate: Date;

  @ApiProperty({ type: Date })
  public publishedAt: Date;

  public static from(document: PolicyDocument): PolicyVersionResponse {
    const response = new PolicyVersionResponse();
    response.type = document.getType;
    response.version = document.getVersion;
    response.title = document.getTitle;
    response.status = document.getStatus;
    response.effectiveDate = document.getEffectiveDate;
    response.publishedAt = document.getPublishedAt;
    return response;
  }
}
