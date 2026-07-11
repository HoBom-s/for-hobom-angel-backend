import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { FacilityPhotoKind } from "src/hb-backend-api/shelter/domain/enums/facility-photo-kind.enum";
import { Address } from "src/hb-backend-api/shelter/domain/model/address";
import { FacilityPhoto } from "src/hb-backend-api/shelter/domain/model/facility-photo";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { BusinessNumber } from "src/hb-backend-api/shelter/domain/model/vo/business-number.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";

const slug = () => ShelterSlug.of("happy-paws");
const addr = (visibility = AddressVisibility.FULL) =>
  Address.of({
    region: "서울",
    city: "강남구",
    roadAddress: "테헤란로 1",
    lat: 37.5,
    lng: 127.0,
    visibility,
  });
const biz = () => BusinessNumber.of("123-45-67890");

const register = (over: Partial<Parameters<typeof Shelter.register>[0]> = {}) =>
  Shelter.register({
    name: "행복한 발자국",
    slug: slug(),
    address: addr(),
    registrant: UserId.generate(),
    businessNumber: biz(),
    ...over,
  });

const reconstitute = (
  over: Partial<Parameters<typeof Shelter.reconstitute>[0]> = {},
) =>
  Shelter.reconstitute({
    id: ShelterId.generate(),
    name: "행복한 발자국",
    slug: slug(),
    address: addr(),
    representatives: [UserId.generate()],
    registrationNumber: null,
    businessNumber: biz(),
    facilityPhotos: [],
    status: ShelterStatus.PENDING_VERIFICATION,
    trustTier: null,
    verifiedAt: null,
    rejectionReason: null,
    verificationSignals: null,
    version: 0,
    ...over,
  });

describe("Shelter aggregate", () => {
  describe("register", () => {
    it("creates a PENDING shelter with the registrant as first representative", () => {
      const registrant = UserId.generate();
      const shelter = register({ registrant });
      expect(shelter.getStatus).toBe(ShelterStatus.PENDING_VERIFICATION);
      expect(shelter.isRepresentedBy(registrant)).toBe(true);
      expect(shelter.getTrustTier).toBeNull();
      expect(shelter.isVerified()).toBe(false);
    });

    it("requires organizational proof", () => {
      expect(() =>
        register({ businessNumber: null, registrationNumber: null }),
      ).toThrow();
    });

    it("rejects a blank name", () => {
      expect(() => register({ name: "  " })).toThrow();
    });
  });

  describe("verification transitions", () => {
    it("approve moves PENDING -> VERIFIED and sets tier + timestamp", () => {
      const shelter = register();
      const at = new Date("2026-07-07T00:00:00Z");
      shelter.approve(at, TrustTier.A);
      expect(shelter.getStatus).toBe(ShelterStatus.VERIFIED);
      expect(shelter.getTrustTier).toBe(TrustTier.A);
      expect(shelter.getVerifiedAt).toEqual(at);
      expect(shelter.isVerified()).toBe(true);
    });

    it("cannot approve a shelter that is not pending", () => {
      const shelter = reconstitute({ status: ShelterStatus.VERIFIED });
      expect(() => shelter.approve(new Date(), TrustTier.A)).toThrow();
    });

    it("reject requires a reason and moves PENDING -> REJECTED", () => {
      const shelter = register();
      expect(() => shelter.reject("  ")).toThrow();
      shelter.reject("서류 불충분");
      expect(shelter.getStatus).toBe(ShelterStatus.REJECTED);
      expect(shelter.getRejectionReason).toBe("서류 불충분");
    });

    it("resubmit moves REJECTED -> PENDING and clears the reason", () => {
      const shelter = reconstitute({
        status: ShelterStatus.REJECTED,
        rejectionReason: "x",
      });
      shelter.resubmit();
      expect(shelter.getStatus).toBe(ShelterStatus.PENDING_VERIFICATION);
      expect(shelter.getRejectionReason).toBeNull();
    });

    it("suspend and reinstate toggle a verified shelter", () => {
      const shelter = reconstitute({
        status: ShelterStatus.VERIFIED,
        trustTier: TrustTier.A,
      });
      shelter.suspend();
      expect(shelter.getStatus).toBe(ShelterStatus.SUSPENDED);
      shelter.reinstate();
      expect(shelter.getStatus).toBe(ShelterStatus.VERIFIED);
    });
  });

  describe("representatives", () => {
    it("adds a representative only when verified and rejects duplicates", () => {
      const pending = register();
      expect(() => pending.addRepresentative(UserId.generate())).toThrow();

      const verified = reconstitute({
        status: ShelterStatus.VERIFIED,
        trustTier: TrustTier.A,
      });
      const rep = UserId.generate();
      verified.addRepresentative(rep);
      expect(verified.isRepresentedBy(rep)).toBe(true);
      expect(() => verified.addRepresentative(rep)).toThrow();
    });

    it("getRepresentatives returns a defensive copy", () => {
      const shelter = register();
      shelter.getRepresentatives.push(UserId.generate());
      expect(shelter.getRepresentatives).toHaveLength(1);
    });
  });

  describe("privilege scaling", () => {
    it("only a verified Tier-A shelter can access applicant PII", () => {
      expect(
        reconstitute({
          status: ShelterStatus.VERIFIED,
          trustTier: TrustTier.A,
        }).canAccessApplicantPii(),
      ).toBe(true);
      expect(
        reconstitute({
          status: ShelterStatus.VERIFIED,
          trustTier: TrustTier.B,
        }).canAccessApplicantPii(),
      ).toBe(false);
      expect(register().canAccessApplicantPii()).toBe(false);
    });

    it("isMappable respects verification and address visibility", () => {
      expect(
        reconstitute({
          status: ShelterStatus.VERIFIED,
          trustTier: TrustTier.A,
          address: addr(AddressVisibility.HIDDEN),
        }).isMappable(),
      ).toBe(false);
      expect(
        reconstitute({
          status: ShelterStatus.VERIFIED,
          trustTier: TrustTier.A,
          address: addr(AddressVisibility.PARTIAL),
        }).isMappable(),
      ).toBe(true);
    });
  });

  describe("facility photos", () => {
    const photo = (key: string) =>
      FacilityPhoto.of({ objectKey: key, kind: FacilityPhotoKind.EXTERIOR });

    it("registers with initial facility photos", () => {
      const shelter = register({ facilityPhotos: [photo("a"), photo("b")] });
      expect(shelter.getFacilityPhotos).toHaveLength(2);
    });

    it("adds and removes photos, rejecting duplicates", () => {
      const shelter = register();
      shelter.addFacilityPhoto(photo("x"));
      expect(shelter.getFacilityPhotos).toHaveLength(1);
      expect(() => shelter.addFacilityPhoto(photo("x"))).toThrow();
      shelter.removeFacilityPhoto("x");
      expect(shelter.getFacilityPhotos).toHaveLength(0);
    });

    it("caps the number of photos", () => {
      const many = Array.from({ length: 21 }, (_, i) => photo(`p${i}`));
      expect(() => register({ facilityPhotos: many })).toThrow();
    });

    it("getFacilityPhotos returns a defensive copy", () => {
      const shelter = register({ facilityPhotos: [photo("a")] });
      shelter.getFacilityPhotos.push(photo("b"));
      expect(shelter.getFacilityPhotos).toHaveLength(1);
    });
  });
});
