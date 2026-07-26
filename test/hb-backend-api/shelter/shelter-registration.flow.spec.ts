import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { DecideApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { RegisterShelterUseCase } from "src/hb-backend-api/shelter/domain/ports/in/register-shelter.use-case";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

/**
 * End-to-end slice: register a shelter, then an operator approves it. Proves the
 * whole chain wired through the real DI graph and a Mongo transaction — the
 * shelter is verified, the registrant is granted SHELTER_ADMIN, and the
 * notification event is written to the outbox, all atomically.
 */
describe("Shelter registration → verification (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let registerShelter: RegisterShelterUseCase;
  let decideApproval: DecideApprovalUseCase;
  let shelterModel: Model<ShelterEntity>;
  let userModel: Model<UserEntity>;
  let outboxModel: Model<OutboxEntity>;

  let seq = 0;
  const seedRegistrant = async (): Promise<Types.ObjectId> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `bom-${seq}`,
      realNameEnc: "enc",
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `bom-${id.toHexString()}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id;
  };

  // A platform operator (SYSTEM_ADMIN) — the decider for SHELTER_VERIFICATION.
  const seedOperator = async (): Promise<Types.ObjectId> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `op-${seq}`,
      realNameEnc: "enc",
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `op-${id.toHexString()}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER, UserRole.SYSTEM_ADMIN],
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id;
  };

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB = mongo.getUri();
    process.env.NODE_ENV = "test";
    process.env.HOBOM_JWT_SECRET = "test-access-secret";
    process.env.HOBOM_JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.HOBOM_JWT_ACCESS_TOKEN_EXPIRED = "15m";
    process.env.HOBOM_JWT_REFRESH_TOKEN_EXPIRED = "30d";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

    const { AppModule } = await import("src/app.module");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    registerShelter = app.get(DIToken.ShelterModule.RegisterShelterUseCase);
    decideApproval = app.get(DIToken.ApprovalModule.DecideApprovalUseCase);
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
    outboxModel = app.get(getModelToken(OutboxEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("registers a shelter as PENDING with a linked approval request", async () => {
    const registrantId = await seedRegistrant();

    const result = await registerShelter.invoke({
      registrantId: registrantId.toHexString(),
      name: "행복한 발자국",
      slug: `pending-${Date.now()}`,
      address: {
        region: "서울",
        city: "강남구",
        roadAddress: "테헤란로 1",
        visibility: AddressVisibility.PARTIAL,
      },
      businessNumber: "1234567890",
    });

    const shelter = await shelterModel.findById(result.shelterId).lean().exec();
    expect(shelter?.status).toBe(ShelterStatus.PENDING_VERIFICATION);
    // The automated checks ran and were attached as decision support.
    expect(shelter?.verificationSignals).toBeDefined();
    expect(result.approvalId).toBeTruthy();
  });

  it("verifies the shelter, grants the registrant admin, and enqueues the event on approval", async () => {
    const registrantId = await seedRegistrant();

    const { shelterId, approvalId } = await registerShelter.invoke({
      registrantId: registrantId.toHexString(),
      name: "행복한 발자국",
      slug: `approved-${Date.now()}`,
      address: {
        region: "서울",
        city: "강남구",
        roadAddress: "테헤란로 2",
        lat: 37.5,
        lng: 127.0,
        visibility: AddressVisibility.FULL,
      },
      businessNumber: "9876543210",
    });

    const operatorId = await seedOperator();
    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: operatorId.toHexString(),
      decision: ApprovalDecision.approve(),
      metadata: { trustTier: TrustTier.A },
    });

    const shelter = await shelterModel.findById(shelterId).lean().exec();
    expect(shelter?.status).toBe(ShelterStatus.VERIFIED);
    expect(shelter?.trustTier).toBe(TrustTier.A);
    expect(shelter?.verifiedAt).toBeInstanceOf(Date);

    const user = await userModel.findById(registrantId).lean().exec();
    expect(user?.shelterRoles).toEqual([
      expect.objectContaining({
        shelterId: expect.any(Types.ObjectId),
        role: UserRole.SHELTER_ADMIN,
      }),
    ]);
    expect(String(user?.shelterRoles[0].shelterId)).toBe(shelterId);

    const events = await outboxModel
      .find({ eventType: EventType.SHELTER_VERIFICATION_APPROVED })
      .lean()
      .exec();
    const mine = events.filter(
      (e) => e.payload.recipientUserId === registrantId.toHexString(),
    );
    expect(mine).toHaveLength(1);
    expect(mine[0].payload.shelterId).toBe(shelterId);
  });

  it("rejects the shelter on a reject decision and grants no role", async () => {
    const registrantId = await seedRegistrant();

    const { shelterId, approvalId } = await registerShelter.invoke({
      registrantId: registrantId.toHexString(),
      name: "행복한 발자국",
      slug: `rejected-${Date.now()}`,
      address: {
        region: "부산",
        city: "해운대구",
        roadAddress: "센텀로 3",
        visibility: AddressVisibility.HIDDEN,
      },
      businessNumber: "1112223330",
    });

    const operatorId = await seedOperator();
    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: operatorId.toHexString(),
      decision: ApprovalDecision.reject(),
      reason: "조직 서류가 확인되지 않았어요.",
    });

    const shelter = await shelterModel.findById(shelterId).lean().exec();
    expect(shelter?.status).toBe(ShelterStatus.REJECTED);
    expect(shelter?.rejectionReason).toBe("조직 서류가 확인되지 않았어요.");

    const user = await userModel.findById(registrantId).lean().exec();
    expect(user?.shelterRoles).toHaveLength(0);
  });
});
