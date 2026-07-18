import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerType } from "src/hb-backend-api/volunteer/domain/enums/volunteer-type.enum";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";
import { VolunteerCertificateEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate.entity";
import { IssueVolunteerCertificateUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/issue-volunteer-certificate.use-case";
import { VerifyCertificateUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/verify-certificate.use-case";

/**
 * End-to-end: a member with an APPROVED signup for an ended event issues a
 * volunteer-service certificate, which is then verifiable by its number.
 */
describe("Volunteer certificate (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let issue: IssueVolunteerCertificateUseCase;
  let verify: VerifyCertificateUseCase;
  let shelterModel: Model<ShelterEntity>;
  let userModel: Model<UserEntity>;
  let eventModel: Model<VolunteerEventEntity>;
  let signupModel: Model<VolunteerSignupEntity>;
  let memberId: Types.ObjectId;

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

    issue = app.get(DIToken.VolunteerModule.IssueVolunteerCertificateUseCase);
    verify = app.get(DIToken.VolunteerModule.VerifyCertificateUseCase);
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
    eventModel = app.get(getModelToken(VolunteerEventEntity.name));
    signupModel = app.get(getModelToken(VolunteerSignupEntity.name));

    const shelterId = new Types.ObjectId();
    await shelterModel.create({
      _id: shelterId,
      name: "행복한 발자국",
      slug: "shelter-cert",
      address: {
        region: "서울",
        city: "강남구",
        roadAddress: "테헤란로 1",
        lat: null,
        lng: null,
        visibility: AddressVisibility.PARTIAL,
      },
      representatives: [],
      status: ShelterStatus.VERIFIED,
      trustTier: TrustTier.A,
      version: 0,
    });

    memberId = new Types.ObjectId();
    await userModel.create({
      _id: memberId,
      nickname: "volunteer1",
      email: "vol1@test.local",
      passwordHash: "hash",
      realNameEnc: "enc",
      phoneEnc: "enc",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      status: UserStatus.ACTIVE,
    });

    const endedEventId = new Types.ObjectId();
    await eventModel.create({
      _id: endedEventId,
      shelterId,
      title: "유기견 산책 봉사",
      description: "함께 산책해요",
      startAt: new Date("2026-06-01T01:00:00Z"),
      endAt: new Date("2026-06-01T04:00:00Z"), // 3h, in the past
      capacity: 10,
      signedUpCount: 1,
      status: VolunteerEventStatus.CLOSED,
      type: VolunteerType.GENERAL,
      version: 0,
    });

    await signupModel.create({
      eventId: endedEventId,
      volunteerId: memberId,
      status: VolunteerSignupStatus.APPROVED,
      version: 0,
    });
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("issues a certificate and verifies it by number", async () => {
    const cert = await issue.invoke(memberId.toString());

    expect(cert.getTotalCount).toBe(1);
    expect(cert.getTotalMinutes).toBe(180);
    expect(cert.getVolunteerNickname).toBe("volunteer1");
    expect(cert.getItems[0].shelterName).toBe("행복한 발자국");
    expect(cert.getItems[0].eventTitle).toBe("유기견 산책 봉사");

    const persisted = await eventModel.db
      .collection<VolunteerCertificateEntity>("volunteer_certificates")
      .countDocuments({ certificateNo: cert.getCertificateNo });
    expect(persisted).toBe(1);

    const verified = await verify.invoke(cert.getCertificateNo);
    expect(verified.getCertificateNo).toBe(cert.getCertificateNo);
    expect(verified.getTotalMinutes).toBe(180);
  });

  it("rejects an unknown certificate number", async () => {
    await expect(verify.invoke("VC-does-not-exist")).rejects.toThrow();
  });
});
