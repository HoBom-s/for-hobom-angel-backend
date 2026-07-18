import { PersonalData } from "src/hb-backend-api/user/domain/model/personal-data";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

/**
 * The audited PII surface, kept OFF the User aggregate on purpose (revealing or
 * destroying PII is a separate, compliance-relevant operation). Backs DSAR
 * export (read) and the identity destroyer (anonymize + residual verification).
 */
export interface PersonalDataPort {
  /** Decrypts and returns the subject's identity/profile PII; null if missing. */
  read(userId: UserId): Promise<PersonalData | null>;
  /** Idempotent in-place anonymization; returns rows modified (0 if already erased). */
  anonymize(userId: UserId): Promise<number>;
  /** Identifiable PII still present for the subject (0 = clean). */
  countResidual(userId: UserId): Promise<number>;
}
