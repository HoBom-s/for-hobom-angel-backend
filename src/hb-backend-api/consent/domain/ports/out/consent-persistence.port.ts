import { Consent } from "src/hb-backend-api/consent/domain/model/consent";

/** Write side for consent records. */
export interface ConsentPersistencePort {
  create(consent: Consent): Promise<Consent>;
  save(consent: Consent): Promise<Consent>;
}
