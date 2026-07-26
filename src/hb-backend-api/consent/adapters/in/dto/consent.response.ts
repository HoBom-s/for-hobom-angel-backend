import { ApiProperty } from "@nestjs/swagger";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { ConsentView } from "src/hb-backend-api/consent/domain/model/consent-view";

/** Result of granting consent. */
export class ConsentResponse {
  @ApiProperty({ enum: PolicyType })
  public policyType: PolicyType;

  @ApiProperty()
  public agreedVersion: number;

  @ApiProperty()
  public status: string;

  @ApiProperty({ type: Date })
  public grantedAt: Date;

  public static from(consent: Consent): ConsentResponse {
    const response = new ConsentResponse();
    response.policyType = consent.getPolicyType;
    response.agreedVersion = consent.getAgreedVersion;
    response.status = consent.getStatus;
    response.grantedAt = consent.getGrantedAt;
    return response;
  }
}

/** Per-policy-type consent state with a re-consent flag. */
export class ConsentStatusResponse {
  @ApiProperty({ enum: PolicyType })
  public policyType: PolicyType;

  @ApiProperty()
  public currentVersion: number;

  @ApiProperty({ nullable: true })
  public agreedVersion: number | null;

  @ApiProperty()
  public status: string;

  @ApiProperty()
  public needsConsent: boolean;

  public static from(view: ConsentView): ConsentStatusResponse {
    const response = new ConsentStatusResponse();
    response.policyType = view.policyType;
    response.currentVersion = view.currentVersion;
    response.agreedVersion = view.agreedVersion;
    response.status = view.status;
    response.needsConsent = view.needsConsent;
    return response;
  }
}
