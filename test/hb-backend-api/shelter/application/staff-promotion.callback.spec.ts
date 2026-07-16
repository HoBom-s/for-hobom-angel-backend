import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { StaffPromotionCallback } from "src/hb-backend-api/shelter/application/staff-promotion.callback";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

const shelterId = ShelterId.generate();
const candidateId = UserId.generate();

const activeCandidate = () =>
  User.reconstitute({
    id: candidateId,
    nickname: Nickname.of("nari"),
    email: Email.of("nari@example.com"),
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
  });

const request = (
  over: {
    context?: Record<string, unknown> | null;
    status?: ApprovalStatus;
  } = {},
) =>
  ApprovalRequest.reconstitute({
    id: ApprovalId.generate(),
    type: ApprovalType.STAFF_PROMOTION,
    subjectRef: candidateId.toString(),
    requesterId: UserId.generate().toString(),
    context:
      over.context === undefined
        ? { shelterId: shelterId.toString() }
        : over.context,
    status: over.status ?? ApprovalStatus.APPROVED,
    decidedBy: "admin-1",
    decidedAt: new Date(),
    reason: null,
    decisionMetadata: null,
    version: 1,
  });

describe("StaffPromotionCallback", () => {
  let candidate: User;
  let userQueryPort: jest.Mocked<UserQueryPort>;
  let userPersistencePort: jest.Mocked<UserPersistencePort>;
  let outboxPersistencePort: jest.Mocked<OutboxPersistencePort>;
  let callback: StaffPromotionCallback;

  beforeEach(() => {
    candidate = activeCandidate();
    userQueryPort = {
      findById: jest.fn().mockResolvedValue(candidate),
      findByNickname: jest.fn(),
      findByEmail: jest.fn(),
      countByStatus: jest.fn(),
      countCreatedBetween: jest.fn(),
    };
    userPersistencePort = { register: jest.fn(), save: jest.fn() };
    outboxPersistencePort = {
      save: jest.fn(),
      markAsSent: jest.fn(),
      markAsFailed: jest.fn(),
    };
    callback = new StaffPromotionCallback(
      userQueryPort,
      userPersistencePort,
      outboxPersistencePort,
    );
  });

  it("declares the STAFF_PROMOTION type", () => {
    expect(callback.type).toBe(ApprovalType.STAFF_PROMOTION);
  });

  describe("onApproved", () => {
    it("grants the candidate shelter-scoped staff and emits the event", async () => {
      await callback.onApproved(request());

      expect(candidate.hasShelterRole(shelterId, UserRole.SHELTER_STAFF)).toBe(
        true,
      );
      expect(userPersistencePort.save).toHaveBeenCalledWith(candidate);

      expect(outboxPersistencePort.save).toHaveBeenCalledTimes(1);
      const emitted = outboxPersistencePort.save.mock.calls[0][0];
      expect(emitted.eventType).toBe(EventType.STAFF_PROMOTION_APPROVED);
      expect(emitted.payload.recipientUserId).toBe(candidateId.toString());
      expect(emitted.payload.shelterId).toBe(shelterId.toString());
    });

    it("throws when the request context has no shelterId", async () => {
      await expect(
        callback.onApproved(request({ context: null })),
      ).rejects.toThrow("shelterId");
      expect(userPersistencePort.save).not.toHaveBeenCalled();
    });
  });

  describe("onRejected", () => {
    it("grants nothing and emits nothing", async () => {
      await callback.onRejected(request({ status: ApprovalStatus.REJECTED }));

      expect(userPersistencePort.save).not.toHaveBeenCalled();
      expect(outboxPersistencePort.save).not.toHaveBeenCalled();
    });
  });
});
