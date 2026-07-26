import { Types } from "mongoose";
import { ConsentEntity } from "src/hb-backend-api/consent/domain/model/consent.entity";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

export type ConsentPatch = Partial<
  Pick<ConsentEntity, "agreedVersion" | "status" | "grantedAt" | "withdrawnAt">
>;

/** Persistence contract over the consents collection. */
export interface ConsentRepository {
  insert(doc: Partial<ConsentEntity>): Promise<ConsentEntity>;
  update(id: Types.ObjectId, patch: ConsentPatch): Promise<void>;
  findByUser(userId: Types.ObjectId): Promise<ConsentEntity[]>;
  findByUserAndType(
    userId: Types.ObjectId,
    policyType: PolicyType,
  ): Promise<ConsentEntity | null>;
}
