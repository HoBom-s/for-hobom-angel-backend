import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

export interface GetShelterVerificationQuery {
  shelterId: string;
  /** The operator viewing the dossier (must be a platform admin). */
  viewerId: string;
}

export interface ShelterVerificationView {
  shelter: Shelter;
  /** The registrant (first representative), resolved to a display nickname. */
  registrant: { id: string; nickname: string } | null;
}

/**
 * The operator's read of a shelter's submitted verification dossier — the full
 * registration data + automated signals behind a pending SHELTER_VERIFICATION,
 * so the operator can review before deciding. Operator-only; lives in the
 * shelter domain so the approval engine stays domain-agnostic.
 */
export interface GetShelterVerificationUseCase {
  invoke(query: GetShelterVerificationQuery): Promise<ShelterVerificationView>;
}
