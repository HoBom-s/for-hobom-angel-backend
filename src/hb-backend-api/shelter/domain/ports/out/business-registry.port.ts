import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";
import { BusinessNumber } from "src/hb-backend-api/shelter/domain/model/vo/business-number.vo";

/**
 * Checks a 사업자/고유번호 for authenticity (valid and not closed) against the tax
 * office. Returns PASS (valid), FAIL (invalid/closed) or UNKNOWN (provider
 * unavailable / not wired yet → manual review).
 */
export interface BusinessRegistryPort {
  verifyBusiness(businessNumber: BusinessNumber): Promise<SignalStatus>;
}
