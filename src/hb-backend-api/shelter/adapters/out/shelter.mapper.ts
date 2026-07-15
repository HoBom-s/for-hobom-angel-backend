import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Address } from "src/hb-backend-api/shelter/domain/model/address";
import { FacilityPhoto } from "src/hb-backend-api/shelter/domain/model/facility-photo";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { ShelterProfile } from "src/hb-backend-api/shelter/domain/model/shelter-profile";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { BusinessNumber } from "src/hb-backend-api/shelter/domain/model/vo/business-number.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterRegistrationNumber } from "src/hb-backend-api/shelter/domain/model/vo/shelter-registration-number.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";
import { ShelterMutablePatch } from "src/hb-backend-api/shelter/domain/repositories/shelter.repository";

/** Rehydrates a persisted document into the {@link Shelter} aggregate. */
export function toDomain(doc: ShelterEntity): Shelter {
  return Shelter.reconstitute({
    id: ShelterId.fromString(String(doc._id)),
    name: doc.name,
    slug: ShelterSlug.of(doc.slug),
    address: Address.of({
      region: doc.address.region,
      city: doc.address.city,
      roadAddress: doc.address.roadAddress,
      lat: doc.address.lat,
      lng: doc.address.lng,
      visibility: doc.address.visibility,
    }),
    representatives: (doc.representatives ?? []).map((id) =>
      UserId.fromString(String(id)),
    ),
    registrationNumber: doc.registrationNumber
      ? ShelterRegistrationNumber.of(doc.registrationNumber)
      : null,
    businessNumber: doc.businessNumber
      ? BusinessNumber.of(doc.businessNumber)
      : null,
    facilityPhotos: (doc.facilityPhotos ?? []).map((p) =>
      FacilityPhoto.of({
        objectKey: p.objectKey,
        kind: p.kind,
        caption: p.caption,
      }),
    ),
    status: doc.status,
    trustTier: doc.trustTier ?? null,
    verifiedAt: doc.verifiedAt ?? null,
    rejectionReason: doc.rejectionReason ?? null,
    verificationSignals: doc.verificationSignals ?? null,
    version: doc.version ?? 0,
    profile: ShelterProfile.of({
      intro: doc.profile?.intro,
      operatingSince: doc.profile?.operatingSince,
      representativeName: doc.profile?.representativeName,
      visitGuide: doc.profile?.visitGuide,
      supportGuide: doc.profile?.supportGuide,
    }),
  });
}

/** Builds the insert document for a freshly registered shelter. */
export function toInsertDoc(shelter: Shelter): Partial<ShelterEntity> {
  return {
    _id: shelter.getId.raw,
    name: shelter.getName,
    slug: shelter.getSlug.raw,
    address: {
      region: shelter.getAddress.getRegion,
      city: shelter.getAddress.getCity,
      roadAddress: shelter.getAddress.getRoadAddress,
      lat: shelter.getAddress.getLat,
      lng: shelter.getAddress.getLng,
      visibility: shelter.getAddress.getVisibility,
    },
    representatives: shelter.getRepresentatives.map((r) => r.raw),
    registrationNumber: shelter.getRegistrationNumber?.raw,
    businessNumber: shelter.getBusinessNumber?.raw,
    facilityPhotos: shelter.getFacilityPhotos.map((p) => p.toPlain()),
    status: shelter.getStatus,
    trustTier: shelter.getTrustTier ?? undefined,
    verifiedAt: shelter.getVerifiedAt ?? undefined,
    rejectionReason: shelter.getRejectionReason ?? undefined,
    verificationSignals: shelter.getVerificationSignals ?? undefined,
    version: shelter.getVersion,
    profile: {
      intro: shelter.getProfile.getIntro,
      operatingSince: shelter.getProfile.getOperatingSince,
      representativeName: shelter.getProfile.getRepresentativeName,
      visitGuide: shelter.getProfile.getVisitGuide,
      supportGuide: shelter.getProfile.getSupportGuide,
    },
  };
}

/** The mutable fields to persist on a version-guarded save. */
export function toMutablePatch(shelter: Shelter): ShelterMutablePatch {
  return {
    status: shelter.getStatus,
    trustTier: shelter.getTrustTier ?? undefined,
    verifiedAt: shelter.getVerifiedAt ?? undefined,
    rejectionReason: shelter.getRejectionReason ?? undefined,
    representatives: shelter.getRepresentatives.map((r) => r.raw),
    facilityPhotos: shelter.getFacilityPhotos.map((p) => p.toPlain()),
    verificationSignals: shelter.getVerificationSignals ?? undefined,
  };
}
