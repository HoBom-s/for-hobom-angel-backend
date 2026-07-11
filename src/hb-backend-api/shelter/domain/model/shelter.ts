import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { Address } from "src/hb-backend-api/shelter/domain/model/address";
import { FacilityPhoto } from "src/hb-backend-api/shelter/domain/model/facility-photo";
import { VerificationSignals } from "src/hb-backend-api/shelter/domain/model/verification-signals";
import { BusinessNumber } from "src/hb-backend-api/shelter/domain/model/vo/business-number.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterRegistrationNumber } from "src/hb-backend-api/shelter/domain/model/vo/shelter-registration-number.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";

/**
 * Shelter aggregate — a tenant, and the root of the trust chain. It can only
 * operate once VERIFIED. The verification state machine and its invariants live
 * here (submit → approve/reject → suspend/reinstate); the *decision* (document
 * review, name match, public-data cross-check) is made by the use-case, which
 * then calls {@link Shelter.approve} / {@link Shelter.reject}.
 *
 * Registration requires organizational proof (a shelter registration number or
 * a business/tax-exempt number) — a real name + selfie doesn't establish that an
 * account is entitled to receive applicants' PII.
 */
export class Shelter {
  private constructor(
    private readonly id: ShelterId,
    private readonly name: string,
    private readonly slug: ShelterSlug,
    private readonly address: Address,
    private readonly representatives: UserId[],
    private readonly registrationNumber: ShelterRegistrationNumber | null,
    private readonly businessNumber: BusinessNumber | null,
    private facilityPhotos: FacilityPhoto[],
    private status: ShelterStatus,
    private trustTier: TrustTier | null,
    private verifiedAt: Date | null,
    private rejectionReason: string | null,
    private readonly verificationSignals: VerificationSignals | null,
    private readonly version: number,
  ) {}

  private static readonly MAX_FACILITY_PHOTOS = 20;

  public static register(params: {
    name: string;
    slug: ShelterSlug;
    address: Address;
    registrant: UserId;
    registrationNumber?: ShelterRegistrationNumber | null;
    businessNumber?: BusinessNumber | null;
    facilityPhotos?: FacilityPhoto[];
    verificationSignals?: VerificationSignals | null;
  }): Shelter {
    if (!params.name?.trim()) {
      throw new Error("보호소 이름이 필요해요.");
    }
    if (!params.registrationNumber && !params.businessNumber) {
      throw new Error(
        "조직 증빙(보호센터등록번호 또는 사업자/고유번호)이 필요해요.",
      );
    }
    const photos = params.facilityPhotos ?? [];
    if (photos.length > Shelter.MAX_FACILITY_PHOTOS) {
      throw new Error(
        `시설 사진은 최대 ${Shelter.MAX_FACILITY_PHOTOS}장까지예요.`,
      );
    }
    return new Shelter(
      ShelterId.generate(),
      params.name.trim(),
      params.slug,
      params.address,
      [params.registrant],
      params.registrationNumber ?? null,
      params.businessNumber ?? null,
      photos,
      ShelterStatus.PENDING_VERIFICATION,
      null,
      null,
      null,
      params.verificationSignals ?? null,
      0,
    );
  }

  public static reconstitute(params: {
    id: ShelterId;
    name: string;
    slug: ShelterSlug;
    address: Address;
    representatives: UserId[];
    registrationNumber: ShelterRegistrationNumber | null;
    businessNumber: BusinessNumber | null;
    facilityPhotos: FacilityPhoto[];
    status: ShelterStatus;
    trustTier: TrustTier | null;
    verifiedAt: Date | null;
    rejectionReason: string | null;
    verificationSignals: VerificationSignals | null;
    version: number;
  }): Shelter {
    return new Shelter(
      params.id,
      params.name,
      params.slug,
      params.address,
      params.representatives,
      params.registrationNumber,
      params.businessNumber,
      params.facilityPhotos,
      params.status,
      params.trustTier,
      params.verifiedAt,
      params.rejectionReason,
      params.verificationSignals,
      params.version,
    );
  }

  // ── state transitions (invariant-enforcing) ─────────────────────
  public approve(at: Date, tier: TrustTier): void {
    this.assertStatus(ShelterStatus.PENDING_VERIFICATION, "승인");
    this.status = ShelterStatus.VERIFIED;
    this.trustTier = tier;
    this.verifiedAt = at;
    this.rejectionReason = null;
  }

  public reject(reason: string): void {
    this.assertStatus(ShelterStatus.PENDING_VERIFICATION, "반려");
    if (!reason?.trim()) {
      throw new Error("반려 사유가 필요해요.");
    }
    this.status = ShelterStatus.REJECTED;
    this.rejectionReason = reason.trim();
  }

  public resubmit(): void {
    this.assertStatus(ShelterStatus.REJECTED, "재신청");
    this.status = ShelterStatus.PENDING_VERIFICATION;
    this.rejectionReason = null;
  }

  public suspend(): void {
    this.assertStatus(ShelterStatus.VERIFIED, "정지");
    this.status = ShelterStatus.SUSPENDED;
  }

  public reinstate(): void {
    this.assertStatus(ShelterStatus.SUSPENDED, "정지 해제");
    this.status = ShelterStatus.VERIFIED;
  }

  public addRepresentative(userId: UserId): void {
    if (!this.isVerified()) {
      throw new Error("검증된 보호소만 대표를 추가할 수 있어요.");
    }
    if (this.representatives.some((r) => r.equals(userId))) {
      throw new Error("이미 대표로 등록된 사용자예요.");
    }
    this.representatives.push(userId);
  }

  // ── facility photos (profile content) ───────────────────────────
  public addFacilityPhoto(photo: FacilityPhoto): void {
    if (this.facilityPhotos.length >= Shelter.MAX_FACILITY_PHOTOS) {
      throw new Error(
        `시설 사진은 최대 ${Shelter.MAX_FACILITY_PHOTOS}장까지예요.`,
      );
    }
    if (this.facilityPhotos.some((p) => p.hasKey(photo.getObjectKey))) {
      throw new Error("이미 등록된 사진이에요.");
    }
    this.facilityPhotos.push(photo);
  }

  public removeFacilityPhoto(objectKey: string): void {
    this.facilityPhotos = this.facilityPhotos.filter(
      (p) => !p.hasKey(objectKey),
    );
  }

  // ── predicates ──────────────────────────────────────────────────
  public isVerified(): boolean {
    return this.status === ShelterStatus.VERIFIED;
  }

  public isRepresentedBy(userId: UserId): boolean {
    return this.representatives.some((r) => r.equals(userId));
  }

  /** Tier-B shelters have reduced trust and cannot directly read applicant PII. */
  public canAccessApplicantPii(): boolean {
    return this.isVerified() && this.trustTier === TrustTier.A;
  }

  public isMappable(): boolean {
    return this.isVerified() && this.address.isMappable();
  }

  private assertStatus(expected: ShelterStatus, action: string): void {
    if (this.status !== expected) {
      throw new Error(`현재 상태(${this.status})에서는 ${action}할 수 없어요.`);
    }
  }

  // ── accessors ───────────────────────────────────────────────────
  public get getId(): ShelterId {
    return this.id;
  }
  public get getName(): string {
    return this.name;
  }
  public get getSlug(): ShelterSlug {
    return this.slug;
  }
  public get getAddress(): Address {
    return this.address;
  }
  public get getRepresentatives(): UserId[] {
    return [...this.representatives];
  }
  public get getRegistrationNumber(): ShelterRegistrationNumber | null {
    return this.registrationNumber;
  }
  public get getBusinessNumber(): BusinessNumber | null {
    return this.businessNumber;
  }
  public get getFacilityPhotos(): FacilityPhoto[] {
    return [...this.facilityPhotos];
  }
  public get getStatus(): ShelterStatus {
    return this.status;
  }
  public get getTrustTier(): TrustTier | null {
    return this.trustTier;
  }
  public get getVerifiedAt(): Date | null {
    return this.verifiedAt;
  }
  public get getRejectionReason(): string | null {
    return this.rejectionReason;
  }
  /** Automated cross-check evidence captured at registration (decision support). */
  public get getVerificationSignals(): VerificationSignals | null {
    return this.verificationSignals;
  }
  public get getAddressVisibility(): AddressVisibility {
    return this.address.getVisibility;
  }
  public get getVersion(): number {
    return this.version;
  }
}
