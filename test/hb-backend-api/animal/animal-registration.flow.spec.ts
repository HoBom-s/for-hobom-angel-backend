import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import { RegisterAnimalUseCase } from "src/hb-backend-api/animal/domain/ports/in/register-animal.use-case";
import { UpdateAnimalProfileUseCase } from "src/hb-backend-api/animal/domain/ports/in/update-animal-profile.use-case";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { ShelterRole } from "src/hb-backend-api/user/domain/model/shelter-role";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

/**
 * End-to-end slice: a verified shelter's staff lists an animal, then edits it.
 * Proves the trust gate (only VERIFIED shelters) and tenant authorization (only
 * that shelter's staff) through the real DI graph.
 */
describe("Animal registration (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let registerAnimal: RegisterAnimalUseCase;
  let updateProfile: UpdateAnimalProfileUseCase;
  let animalModel: Model<AnimalEntity>;
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
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `u-${id.toHexString()}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles,
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id;
  };

  const command = (shelterId: Types.ObjectId, staffId: Types.ObjectId) => ({
    shelterId: shelterId.toHexString(),
    registeredBy: staffId.toHexString(),
    name: "초코",
    species: AnimalSpecies.DOG,
    description: "사람을 좋아해요",
    traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL, ageMonths: 18 },
    health: { neutered: true, vaccinated: true },
    intake: {
      intakeDate: new Date("2026-01-02"),
      noticeNumber: "부산-2026-0001",
    },
  });

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

    registerAnimal = app.get(DIToken.AnimalModule.RegisterAnimalUseCase);
    updateProfile = app.get(DIToken.AnimalModule.UpdateAnimalProfileUseCase);
    animalModel = app.get(getModelToken(AnimalEntity.name));
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("lets a verified shelter's staff list an AVAILABLE animal", async () => {
    const shelterId = await seedShelter();
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);

    const { animalId } = await registerAnimal.invoke(
      command(shelterId, staffId),
    );

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.AVAILABLE);
    expect(String(animal?.shelterId)).toBe(shelterId.toHexString());
    expect(animal?.intake.noticeNumber).toBe("부산-2026-0001");
  });

  it("lets staff edit the animal profile", async () => {
    const shelterId = await seedShelter();
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);
    const { animalId } = await registerAnimal.invoke(
      command(shelterId, staffId),
    );

    await updateProfile.invoke({
      animalId,
      editedBy: staffId.toHexString(),
      name: "초코(수정)",
      species: AnimalSpecies.DOG,
      description: "산책을 좋아해요",
      traits: { sex: AnimalSex.FEMALE, size: AnimalSize.MEDIUM },
      health: { neutered: true, vaccinated: false },
    });

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.name).toBe("초코(수정)");
    expect(animal?.traits.size).toBe(AnimalSize.MEDIUM);
    expect(animal?.health.vaccinated).toBe(false);
  });

  it("refuses registration under an unverified shelter", async () => {
    const shelterId = await seedShelter(ShelterStatus.PENDING_VERIFICATION);
    const staffId = await seedUser([
      { shelterId, role: UserRole.SHELTER_STAFF },
    ]);

    await expect(
      registerAnimal.invoke(command(shelterId, staffId)),
    ).rejects.toThrow("검증된 보호소");
  });

  it("refuses a non-staff registrant", async () => {
    const shelterId = await seedShelter();
    const outsiderId = await seedUser();

    await expect(
      registerAnimal.invoke(command(shelterId, outsiderId)),
    ).rejects.toThrow("보호소 스태프");
  });
});
