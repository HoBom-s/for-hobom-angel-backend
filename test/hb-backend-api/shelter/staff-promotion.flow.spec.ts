import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { DecideApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import { RequestStaffPromotionUseCase } from "src/hb-backend-api/shelter/domain/ports/in/request-staff-promotion.use-case";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { ShelterRole } from "src/hb-backend-api/user/domain/model/shelter-role";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

/**
 * End-to-end slice: a shelter admin requests a member's promotion, then the
 * decision approves it. Proves the approval engine's SECOND consumer — a distinct
 * approval type reusing the same engine — grants the candidate shelter-scoped
 * staff through the real DI graph and a Mongo transaction.
 */
describe("Staff promotion (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let requestPromotion: RequestStaffPromotionUseCase;
  let decideApproval: DecideApprovalUseCase;
  let userModel: Model<UserEntity>;

  let seq = 0;
  const seedUser = async (
    shelterRoles: ShelterRole[] = [],
  ): Promise<Types.ObjectId> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `u-${seq}`,
      realNameEnc: "enc",
      ci: `ci-${id.toHexString()}`,
      phoneEnc: "enc",
      email: "u@example.com",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles,
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

    requestPromotion = app.get(
      DIToken.ShelterModule.RequestStaffPromotionUseCase,
    );
    decideApproval = app.get(DIToken.ApprovalModule.DecideApprovalUseCase);
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("grants shelter-scoped staff to the candidate on approval", async () => {
    const shelterId = new Types.ObjectId();
    const adminId = await seedUser([
      { shelterId, role: UserRole.SHELTER_ADMIN },
    ]);
    const candidateId = await seedUser();

    const { approvalId } = await requestPromotion.invoke({
      shelterId: shelterId.toHexString(),
      candidateUserId: candidateId.toHexString(),
      requestedBy: adminId.toHexString(),
    });

    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: adminId.toHexString(),
      decision: ApprovalDecision.approve(),
    });

    const candidate = await userModel.findById(candidateId).lean().exec();
    expect(candidate?.shelterRoles).toEqual([
      expect.objectContaining({
        shelterId: expect.any(Types.ObjectId),
        role: UserRole.SHELTER_STAFF,
      }),
    ]);
    expect(String(candidate?.shelterRoles[0].shelterId)).toBe(
      shelterId.toHexString(),
    );
  });

  it("grants nothing when the decision rejects", async () => {
    const shelterId = new Types.ObjectId();
    const adminId = await seedUser([
      { shelterId, role: UserRole.SHELTER_ADMIN },
    ]);
    const candidateId = await seedUser();

    const { approvalId } = await requestPromotion.invoke({
      shelterId: shelterId.toHexString(),
      candidateUserId: candidateId.toHexString(),
      requestedBy: adminId.toHexString(),
    });

    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: adminId.toHexString(),
      decision: ApprovalDecision.reject(),
      reason: "아직 준비되지 않았어요.",
    });

    const candidate = await userModel.findById(candidateId).lean().exec();
    expect(candidate?.shelterRoles).toHaveLength(0);
  });

  it("refuses a requester who is not an admin of the shelter", async () => {
    const shelterId = new Types.ObjectId();
    const outsiderId = await seedUser();
    const candidateId = await seedUser();

    await expect(
      requestPromotion.invoke({
        shelterId: shelterId.toHexString(),
        candidateUserId: candidateId.toHexString(),
        requestedBy: outsiderId.toHexString(),
      }),
    ).rejects.toThrow("보호소 관리자");
  });
});
