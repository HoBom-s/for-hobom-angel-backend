import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/** Read side for policy documents. */
export interface PolicyQueryPort {
  /** The version currently in effect for a type (PUBLISHED), or null. */
  findCurrent(type: PolicyType): Promise<PolicyDocument | null>;
  /** All versions of a type, newest first. */
  findVersions(type: PolicyType): Promise<PolicyDocument[]>;
  /** The next version number to assign for a type (max + 1; 1 if none). */
  nextVersion(type: PolicyType): Promise<number>;
}
