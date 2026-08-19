import { ForbiddenException } from "@nestjs/common";
import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { HealthProfile } from "src/hb-backend-api/animal/domain/model/health-profile";
import { IntakeRecord } from "src/hb-backend-api/animal/domain/model/intake-record";
import { Traits } from "src/hb-backend-api/animal/domain/model/traits";
import { AnimalPersistencePort } from "src/hb-backend-api/animal/domain/ports/out/animal-persistence.port";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxPersistencePort } from "src/hb-backend-api/outbox/domain/ports/out/outbox-persistence.port";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationPersistencePort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-persistence.port";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { FosterApprovalCallback } from "src/hb-backend-api/foster/application/foster-approval.callback";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { User } from "src/hb-backend-api/user/domain/model/user";
import { Email } from "src/hb-backend-api/user/domain/model/vo/email.vo";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

const shelterId = ShelterId.generate();
const applicantId = UserId.generate();

const activeUser = (id: UserId) =>
  User.reconstitute({
    id,
    nickname: Nickname.of("staff"),
    email: Email.of("staff@example.com"),
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

const shelterManager = (id: UserId) => {
  const user = activeUser(id);
  user.grantShelterAdmin(shelterId);
  return user;
};

const reservedAnimal = () => {
  const animal = Animal.register({
    shelterId,
    name: "초코",
    species: AnimalSpecies.DOG,
    traits: Traits.of({ sex: AnimalSex.FEMALE, size: AnimalSize.SMALL }),
    health: HealthProfile.of({ neutered: true, vaccinated: true }),
    intake: IntakeRecord.of({ intakeDate: new Date("2026-01-02") }),
  });
  animal.reserve();
  return animal;
};

describe("FosterApprovalCallback", () => {
  let animal: Animal;
  let application: FosterApplication;
  let applicationQueryPort: jest.Mocked<FosterApplicationQueryPort>;
  let applicationPersistencePort: jest.Mocked<FosterApplicationPersistencePort>;
  let animalQueryPort: jest.Mocked<AnimalQueryPort>;
  let animalPersistencePort: jest.Mocked<AnimalPersistencePort>;
  let outboxPersistencePort: jest.Mocked<OutboxPersistencePort>;
  let userQueryPort: jest.Mocked<UserQueryPort>;
  let callback: FosterApprovalCallback;

  const request = (over: { status?: ApprovalStatus; reason?: string } = {}) =>
    ApprovalRequest.reconstitute({
      id: ApprovalId.generate(),
      type: ApprovalType.FOSTER,
      subjectRef: application.getId.toString(),
      requesterId: applicantId.toString(),
      context: { animalId: animal.getId.toString() },
      status: over.status ?? ApprovalStatus.APPROVED,
      decidedBy: "operator-1",
      decidedAt: new Date(),
      reason: over.reason ?? null,
      decisionMetadata: null,
      version: 1,
    });

  beforeEach(() => {
    animal = reservedAnimal();
    application = FosterApplication.submit({
      animalId: animal.getId,
      shelterId,
      applicantId,
      questionnaireVersion: 1,
      answers: [],
      plannedEndDate: null,
    });
    applicationQueryPort = {
      findById: jest.fn().mockResolvedValue(application),
      findPageByShelter: jest.fn(),
      findPageByApplicant: jest.fn(),
      countByApplicantAndStatus: jest.fn(),
      countByShelterAndStatus: jest.fn(),
      countByStatus: jest.fn(),
    };
    applicationPersistencePort = { create: jest.fn(), save: jest.fn() };
    animalQueryPort = {
      findById: jest.fn().mockResolvedValue(animal),
      findByShelter: jest.fn(),
      search: jest.fn(),
      countByShelterAndStatuses: jest.fn(),
      countByStatuses: jest.fn(),
    };
    animalPersistencePort = { create: jest.fn(), save: jest.fn() };
    outboxPersistencePort = {
      save: jest.fn(),
      markAsSent: jest.fn(),
      markAsFailed: jest.fn(),
    };
    userQueryPort = {
      findById: jest.fn(),
      findByNickname: jest.fn(),
      findByEmail: jest.fn(),
      findByShelter: jest.fn(),
      countByStatus: jest.fn(),
      countCreatedBetween: jest.fn(),
      findWithdrawnToPurge: jest.fn(),
    };
    callback = new FosterApprovalCallback(
      applicationQueryPort,
      applicationPersistencePort,
      animalQueryPort,
      animalPersistencePort,
      outboxPersistencePort,
      userQueryPort,
      { notify: jest.fn() },
    );
  });

  it("declares the FOSTER type", () => {
    expect(callback.type).toBe(ApprovalType.FOSTER);
  });

  describe("authorize", () => {
    it("allows a staff member of the application's shelter", async () => {
      const actorId = UserId.generate();
      userQueryPort.findById.mockResolvedValue(shelterManager(actorId));

      await expect(
        callback.authorize(request(), actorId.toString()),
      ).resolves.toBeUndefined();
    });

    it("forbids a user who does not manage the shelter", async () => {
      const actorId = UserId.generate();
      userQueryPort.findById.mockResolvedValue(activeUser(actorId));

      await expect(
        callback.authorize(request(), actorId.toString()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("forbids when the actor does not exist", async () => {
      userQueryPort.findById.mockResolvedValue(null);

      await expect(
        callback.authorize(request(), UserId.generate().toString()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it("fosters the animal, approves the application, and emits the event", async () => {
    await callback.onApproved(request());

    expect(application.getStatus).toBe(FosterApplicationStatus.APPROVED);
    expect(animal.getStatus).toBe(AnimalStatus.FOSTERED);
    expect(outboxPersistencePort.save).toHaveBeenCalledTimes(1);
    expect(outboxPersistencePort.save.mock.calls[0][0].eventType).toBe(
      EventType.FOSTER_APPROVED,
    );
  });

  it("rejects the application and releases the animal, emitting nothing", async () => {
    await callback.onRejected(request({ reason: "조건 불충족" }));

    expect(application.getStatus).toBe(FosterApplicationStatus.REJECTED);
    expect(animal.getStatus).toBe(AnimalStatus.AVAILABLE);
    expect(outboxPersistencePort.save).not.toHaveBeenCalled();
  });
});
