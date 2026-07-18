import { ApiProperty } from "@nestjs/swagger";
import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";

/** A full policy version, including its body. */
export class PolicyResponse {
  @ApiProperty({ enum: PolicyType })
  public type: PolicyType;

  @ApiProperty()
  public version: number;

  @ApiProperty()
  public title: string;

  @ApiProperty()
  public content: string;

  @ApiProperty({ enum: PolicyStatus })
  public status: PolicyStatus;

  @ApiProperty({ type: Date })
  public effectiveDate: Date;

  @ApiProperty({ type: Date })
  public publishedAt: Date;

  public static from(document: PolicyDocument): PolicyResponse {
    const response = new PolicyResponse();
    response.type = document.getType;
    response.version = document.getVersion;
    response.title = document.getTitle;
    response.content = document.getContent;
    response.status = document.getStatus;
    response.effectiveDate = document.getEffectiveDate;
    response.publishedAt = document.getPublishedAt;
    return response;
  }
}
