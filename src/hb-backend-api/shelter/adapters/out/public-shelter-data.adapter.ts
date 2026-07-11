import { Injectable } from "@nestjs/common";
import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";
import { ShelterRegistrationNumber } from "src/hb-backend-api/shelter/domain/model/vo/shelter-registration-number.vo";
import {
  PublicShelterDataPort,
  PublicShelterVerification,
} from "src/hb-backend-api/shelter/domain/ports/out/public-shelter-data.port";

/**
 * Pending adapter for the national shelter dataset
 * (전국동물보호센터정보표준데이터, 농림축산검역본부 OpenAPI). Until the provider is
 * wired, every lookup returns UNKNOWN so verification falls back to full manual
 * review (the MVP policy) — never a false PASS.
 *
 * TODO: call the 농림축산검역본부 REST OpenAPI (보호센터등록번호 조회) and map the
 * response to PASS/FAIL, surfacing the registered representative name (for the
 * name-match signal) and the center's lat/lng (for the map).
 */
@Injectable()
export class PublicShelterDataAdapter implements PublicShelterDataPort {
  public verifyRegistration(
    registrationNumber: ShelterRegistrationNumber,
  ): Promise<PublicShelterVerification> {
    void registrationNumber; // TODO: look up against the 농림축산검역본부 OpenAPI.
    return Promise.resolve({ status: SignalStatus.UNKNOWN });
  }
}
