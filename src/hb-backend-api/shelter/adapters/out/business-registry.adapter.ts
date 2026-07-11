import { Injectable } from "@nestjs/common";
import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";
import { BusinessNumber } from "src/hb-backend-api/shelter/domain/model/vo/business-number.vo";
import { BusinessRegistryPort } from "src/hb-backend-api/shelter/domain/ports/out/business-registry.port";

/**
 * Pending adapter for the tax-office business-number status API
 * (국세청 사업자등록 상태조회). Until wired, returns UNKNOWN so the operator reviews
 * manually — never a false PASS.
 *
 * TODO: call the 국세청 사업자등록정보 진위확인/상태조회 API and map to PASS (valid,
 * not closed) / FAIL (invalid or closed).
 */
@Injectable()
export class BusinessRegistryAdapter implements BusinessRegistryPort {
  public verifyBusiness(businessNumber: BusinessNumber): Promise<SignalStatus> {
    void businessNumber; // TODO: query the 국세청 상태조회 API with this number.
    return Promise.resolve(SignalStatus.UNKNOWN);
  }
}
