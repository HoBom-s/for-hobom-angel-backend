import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/** Write side for policy documents. */
export interface PolicyPersistencePort {
  /** Archive the currently-published version of a type (before a new publish). */
  archiveCurrent(type: PolicyType): Promise<void>;
  /** Persist a new version; returns it with its id. */
  save(document: PolicyDocument): Promise<PolicyDocument>;
}
