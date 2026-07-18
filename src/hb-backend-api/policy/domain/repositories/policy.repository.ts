import { PolicyDocumentEntity } from "src/hb-backend-api/policy/domain/model/policy-document.entity";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/** Persistence contract over the policy_documents collection. */
export interface PolicyRepository {
  insert(doc: Partial<PolicyDocumentEntity>): Promise<PolicyDocumentEntity>;
  /** Flip the current PUBLISHED version of a type to ARCHIVED. */
  archivePublished(type: PolicyType): Promise<void>;
  findCurrent(type: PolicyType): Promise<PolicyDocumentEntity | null>;
  findVersions(type: PolicyType): Promise<PolicyDocumentEntity[]>;
  maxVersion(type: PolicyType): Promise<number>;
}
