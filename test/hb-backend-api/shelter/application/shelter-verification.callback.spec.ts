import { ForbiddenException } from "@nestjs/common";
import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { Address } from "src/hb-backend-api/shelter/domain/model/address";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";
import { BusinessNumber } from "src/hb-backend-api/shelter/domain/model/vo/business-number.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterSlug } from "src/hb-backend-api/shelter/domain/model/vo/shelter-slug.vo";
import { ShelterPersistencePort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-persistence.port";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { ShelterVerificationCallback } from "src/hb-backend-api/shelter/application/shelter-verification.callback";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { NotificationType } from "src/hb-backend-api/notification/domain/enums/notification-type.enum";

const shelterId = ShelterId.generate();
const registrantId = UserId.generate();

const pendingShelter = () =>
  Shelter.reconstitute({
    id: shelterId,
    name: "행복한 발자국",
    slug: ShelterSlug.of("happy-paws"),
    address: Address.of({
      region: "서울",
      city: "강남구",
      roadAddress: "테헤란로 1",
      visibility: AddressVisibility.PARTIAL,
    }),
    representatives: [registrantId],
    registrationNumber: null,
    businessNumber: BusinessNumber.of("1234567890"),
    facilityPhotos: [],
    status: ShelterStatus.PENDING_VERIFICATION,
    trustTier: null,
    verifiedAt: null,
    rejectionReason: null,
    verificationSignals: null,
    version: 0,
  });

const activeRegistrant = () =>
  User.reconstitute({
    id: registrantId,
    nickname: Nickname.of("bom"),
    email: Email.of("bom@example.com"),
    passwordHash: "hashed",
    verifiedChannel: VerifiedChannel.EMAIL,
    roles: [UserRole.USER],
    shelterRoles: [],
    status: UserStatus.ACTIVE,
    withdrawnAt: null,
    purgeAfter: null,
    suspendedAt: null,
    sanctionReason: null,
    version: 0,
    createdAt: null,
  });

const operator = () =>
  User.reconstitute({
    id: UserId.generate(),
    nickname: Nickname.of("op"),
    email: Email.of("op@example.com"),
    passwordHash: "hashed",
    verifiedChannel: VerifiedChannel.EMAIL,
    roles: [UserRole.SYSTEM_ADMIN],
    shelterRoles: [],
    status: UserStatus.ACTIVE,
    withdrawnAt: null,
    purgeAfter: null,
    suspendedAt: null,
    sanctionReason: null,
    version: 0,
    createdAt: null,
  });

const request = (over: { status?: ApprovalStatus; reason?: string } = {}) =>
  ApprovalRequest.reconstitute({
    id: ApprovalId.generate(),
    type: ApprovalType.SHELTER_VERIFICATION,
    subjectRef: shelterId.toString(),
    requesterId: registrantId.toString(),
    status: over.status ?? ApprovalStatus.APPROVED,
    decidedBy: "operator-1",
    decidedAt: new Date(),
    reason: over.reason ?? null,
    decisionMetadata: { trustTier: TrustTier.A },
    version: 1,
  });

describe("ShelterVerificationCallback", () => {
  let shelter: Shelter;
  let registrant: User;
  let shelterQueryPort: jest.Mocked<ShelterQueryPort>;
  let shelterPersistencePort: jest.Mocked<ShelterPersistencePort>;
  let userQueryPort: jest.Mocked<UserQueryPort>;
  let userPersistencePort: jest.Mocked<UserPersistencePort>;
  let outboxPersistencePort: jest.Mocked<OutboxPersistencePort>;
  let notifyUseCase: { notify: jest.Mock };
  let callback: ShelterVerificationCallback;

  beforeEach(() => {
    shelter = pendingShelter();
    registrant = activeRegistrant();
    shelterQueryPort = {
      findById: jest.fn().mockResolvedValue(shelter),
      findBySlug: jest.fn(),
      findMappable: jest.fn(),
      findVerified: jest.fn(),
      countByStatus: jest.fn(),
    };
    shelterPersistencePort = { create: jest.fn(), save: jest.fn() };
    userQueryPort = {
      findById: jest.fn().mockResolvedValue(registrant),
      findByNickname: jest.fn(),
      findByEmail: jest.fn(),
      findByShelter: jest.fn(),
      countByStatus: jest.fn(),
      countCreatedBetween: jest.fn(),
      findWithdrawnToPurge: jest.fn(),
    };
    userPersistencePort = { register: jest.fn(), save: jest.fn() };
    outboxPersistencePort = {
      save: jest.fn(),
      markAsSent: jest.fn(),
      markAsFailed: jest.fn(),
    };
    notifyUseCase = { notify: jest.fn() };
    callback = new ShelterVerificationCallback(
      shelterQueryPort,
      shelterPersistencePort,
      userQueryPort,
      userPersistencePort,
      outboxPersistencePort,
      notifyUseCase,
    );
  });

  it("declares the SHELTER_VERIFICATION type", () => {
    expect(callback.type).toBe(ApprovalType.SHELTER_VERIFICATION);
  });

  describe("authorize", () => {
    it("allows a platform operator", async () => {
      userQueryPort.findById.mockResolvedValue(operator());

      await expect(
        callback.authorize(request(), UserId.generate().toString()),
      ).resolves.toBeUndefined();
    });

    it("forbids a non-operator (e.g. the registrant)", async () => {
      userQueryPort.findById.mockResolvedValue(registrant);

      await expect(
        callback.authorize(request(), registrantId.toString()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("forbids when the actor does not exist", async () => {
      userQueryPort.findById.mockResolvedValue(null);

      await expect(
        callback.authorize(request(), UserId.generate().toString()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("onApproved", () => {
    it("verifies the shelter, grants the registrant admin, and emits the event", async () => {
      await callback.onApproved(request());

      expect(shelter.isVerified()).toBe(true);
      expect(shelter.getTrustTier).toBe(TrustTier.A);
      expect(shelterPersistencePort.save).toHaveBeenCalledWith(shelter);

      expect(registrant.hasShelterRole(shelterId, UserRole.SHELTER_ADMIN)).toBe(
        true,
      );
      expect(userPersistencePort.save).toHaveBeenCalledWith(registrant);

      expect(outboxPersistencePort.save).toHaveBeenCalledTimes(1);
      const emitted = outboxPersistencePort.save.mock.calls[0][0];
      expect(emitted.eventType).toBe(EventType.SHELTER_VERIFICATION_APPROVED);
      expect(emitted.payload.recipientUserId).toBe(registrantId.toString());
    });

    it("honors an explicit tier-B decision", async () => {
      const req = ApprovalRequest.reconstitute({
        id: ApprovalId.generate(),
        type: ApprovalType.SHELTER_VERIFICATION,
        subjectRef: shelterId.toString(),
        requesterId: registrantId.toString(),
        status: ApprovalStatus.APPROVED,
        decidedBy: "operator-1",
        decidedAt: new Date(),
        reason: null,
        decisionMetadata: { trustTier: TrustTier.B },
        version: 1,
      });

      await callback.onApproved(req);

      expect(shelter.getTrustTier).toBe(TrustTier.B);
    });

    it("throws when the shelter is gone", async () => {
      shelterQueryPort.findById.mockResolvedValue(null);
      await expect(callback.onApproved(request())).rejects.toThrow("보호소");
      expect(shelterPersistencePort.save).not.toHaveBeenCalled();
    });
  });

  describe("onRejected", () => {
    it("rejects the shelter with the decision reason and emits nothing", async () => {
      await callback.onRejected(request({ reason: "서류 불충분" }));

      expect(shelter.getStatus).toBe(ShelterStatus.REJECTED);
      expect(shelter.getRejectionReason).toBe("서류 불충분");
      expect(shelterPersistencePort.save).toHaveBeenCalledWith(shelter);
      expect(userPersistencePort.save).not.toHaveBeenCalled();
      expect(outboxPersistencePort.save).not.toHaveBeenCalled();
    });

    it("notifies the requester with shelterId in the deep-link context", async () => {
      await callback.onRejected(request({ reason: "서류 불충분" }));

      expect(notifyUseCase.notify).toHaveBeenCalledWith({
        recipientId: registrantId.toString(),
        type: NotificationType.SHELTER_VERIFICATION_REJECTED,
        subjectRef: shelterId.toString(),
        context: {
          shelterId: shelterId.toString(),
          reason: "서류 불충분",
        },
      });
    });
  });
});
