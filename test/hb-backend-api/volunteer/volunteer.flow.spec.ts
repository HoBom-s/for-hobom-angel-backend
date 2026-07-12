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
import { ShelterRole } from "src/hb-backend-api/user/domain/model/shelter-role";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";
import { CreateVolunteerEventUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/create-volunteer-event.use-case";
import { SignUpForVolunteerUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/sign-up-for-volunteer.use-case";
import { WithdrawVolunteerSignupUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/withdraw-volunteer-signup.use-case";
import { CancelVolunteerEventUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/cancel-volunteer-event.use-case";

const START = new Date("2027-06-01T10:00:00.000Z");
const END = new Date("2027-06-01T14:00:00.000Z");

/**
 * End-to-end slice: a verified shelter's staff opens a volunteer event, members
 * sign up (capacity-bounded), withdraw, and the staff cancels — proving the
 * capacity/roster invariants hold through the real DI graph and Mongo
 * transactions.
 */
describe("Volunteer (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let createEvent: CreateVolunteerEventUseCase;
  let signUp: SignUpForVolunteerUseCase;
  let withdraw: WithdrawVolunteerSignupUseCase;
  let cancel: CancelVolunteerEventUseCase;
  let eventModel: Model<VolunteerEventEntity>;
  let shelterModel: Model<ShelterEntity>;
  let userModel: Model<UserEntity>;

  let seq = 0;

  const seedShelter = async (
    status: ShelterStatus = ShelterStatus.VERIFIED,
  ): Promise<Types.ObjectId> => {
    const id = new Types.ObjectId();
    seq += 1;
    await shelterModel.create({
      _id: id,
      name: "행복한 발자국",
      slug: `shelter-${seq}`,
      address: {
        region: "서울",
        city: "강남구",
        roadAddress: "테헤란로 1",
        lat: null,
        lng: null,
        visibility: AddressVisibility.PARTIAL,
      },
      representatives: [],
      status,
      trustTier: status === ShelterStatus.VERIFIED ? TrustTier.A : undefined,
      version: 0,
    });
    return id;
  };

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

  const openEvent = async (
    shelterId: Types.ObjectId,
    staffId: Types.ObjectId,
    capacity = 2,
  ): Promise<string> => {
    const { eventId } = await createEvent.invoke({
      shelterId: shelterId.toHexString(),
      createdBy: staffId.toHexString(),
      title: "유기견 목욕 봉사",
      startAt: START,
      endAt: END,
      capacity,
    });
    return eventId;
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

    createEvent = app.get(DIToken.VolunteerModule.CreateVolunteerEventUseCase);
    signUp = app.get(DIToken.VolunteerModule.SignUpForVolunteerUseCase);
    withdraw = app.get(DIToken.VolunteerModule.WithdrawVolunteerSignupUseCase);
    cancel = app.get(DIToken.VolunteerModule.CancelVolunteerEventUseCase);
    eventModel = app.get(getModelToken(VolunteerEventEntity.name));
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("opens an event and a member signup reserves a slot", async () => {
    const shelterId = await seedShelter();
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);
    const volunteerId = await seedUser();

    const eventId = await openEvent(shelterId, staffId);
    await signUp.invoke({
      eventId,
      volunteerId: volunteerId.toHexString(),
    });

    const event = await eventModel.findById(eventId).lean().exec();
    expect(event?.signedUpCount).toBe(1);
    expect(event?.status).toBe(VolunteerEventStatus.OPEN);
  });

  it("refuses signups past capacity", async () => {
    const shelterId = await seedShelter();
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);
    const eventId = await openEvent(shelterId, staffId, 1);

    const first = await seedUser();
    await signUp.invoke({ eventId, volunteerId: first.toHexString() });

    // capacity is 1 → a second volunteer is refused
    const second = await seedUser();
    await expect(
      signUp.invoke({ eventId, volunteerId: second.toHexString() }),
    ).rejects.toThrow("받을 수 없어요");
  });

  it("refuses a duplicate signup by the same volunteer", async () => {
    const shelterId = await seedShelter();
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);
    // capacity 2 so the event is not full when the same member retries
    const eventId = await openEvent(shelterId, staffId, 2);

    const volunteer = await seedUser();
    await signUp.invoke({ eventId, volunteerId: volunteer.toHexString() });
    await expect(
      signUp.invoke({ eventId, volunteerId: volunteer.toHexString() }),
    ).rejects.toThrow("이미 지원");
  });

  it("withdrawing frees the slot for another volunteer", async () => {
    const shelterId = await seedShelter();
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);
    const eventId = await openEvent(shelterId, staffId, 1);

    const first = await seedUser();
    const { signupId } = await signUp.invoke({
      eventId,
      volunteerId: first.toHexString(),
    });
    await withdraw.invoke({ signupId, volunteerId: first.toHexString() });

    let event = await eventModel.findById(eventId).lean().exec();
    expect(event?.signedUpCount).toBe(0);

    const second = await seedUser();
    await signUp.invoke({ eventId, volunteerId: second.toHexString() });
    event = await eventModel.findById(eventId).lean().exec();
    expect(event?.signedUpCount).toBe(1);
  });

  it("cancels an event and then refuses signups", async () => {
    const shelterId = await seedShelter();
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);
    const eventId = await openEvent(shelterId, staffId);

    await cancel.invoke({ eventId, cancelledBy: staffId.toHexString() });

    const event = await eventModel.findById(eventId).lean().exec();
    expect(event?.status).toBe(VolunteerEventStatus.CANCELLED);

    const volunteerId = await seedUser();
    await expect(
      signUp.invoke({ eventId, volunteerId: volunteerId.toHexString() }),
    ).rejects.toThrow("받을 수 없어요");
  });

  it("refuses event creation by a non-staff user or under an unverified shelter", async () => {
    const shelterId = await seedShelter();
    const outsider = await seedUser();
    await expect(openEvent(shelterId, outsider)).rejects.toThrow(
      "보호소 스태프",
    );

    const pending = await seedShelter(ShelterStatus.PENDING_VERIFICATION);
    const staffId = await seedUser([
      { shelterId: pending, role: UserRole.SHELTER_STAFF },
    ]);
    await expect(openEvent(pending, staffId)).rejects.toThrow("검증된 보호소");
  });
});
