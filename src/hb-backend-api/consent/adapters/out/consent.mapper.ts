import { Types } from "mongoose";
import { Consent } from "src/hb-backend-api/consent/domain/model/consent";
import { ConsentEntity } from "src/hb-backend-api/consent/domain/model/consent.entity";

export function toDomain(doc: ConsentEntity): Consent {
  return Consent.reconstitute({
    id: String(doc._id),
    userId: String(doc.userId),
    policyType: doc.policyType,
    agreedVersion: doc.agreedVersion,
    status: doc.status,
    grantedAt: doc.grantedAt,
    withdrawnAt: doc.withdrawnAt ?? null,
  });
}

export function toInsertDoc(consent: Consent): Partial<ConsentEntity> {
  return {
    userId: new Types.ObjectId(consent.getUserId),
    policyType: consent.getPolicyType,
    agreedVersion: consent.getAgreedVersion,
    status: consent.getStatus,
    grantedAt: consent.getGrantedAt,
    withdrawnAt: consent.getWithdrawnAt,
  };
}
