import { SignalStatus } from "src/hb-backend-api/shelter/domain/enums/signal-status.enum";
import { ShelterRegistrationNumber } from "src/hb-backend-api/shelter/domain/model/vo/shelter-registration-number.vo";

/**
 * Result of cross-checking a 보호센터등록번호 against the national shelter dataset
 * (전국동물보호센터정보표준데이터, 농림축산검역본부). `representativeName` (when the
 * provider exposes it) feeds the pivotal name-match signal; coordinates seed the
 * map. `status` is PASS (matched), FAIL (no such registration) or UNKNOWN (the
 * provider could not be reached / isn't wired yet → manual review).
 */
export interface PublicShelterVerification {
  status: SignalStatus;
  representativeName?: string;
  lat?: number;
  lng?: number;
}

/** Cross-checks government-designated shelter registrations. */
export interface PublicShelterDataPort {
  verifyRegistration(
    registrationNumber: ShelterRegistrationNumber,
  ): Promise<PublicShelterVerification>;
}
