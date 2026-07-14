import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalSort } from "src/hb-backend-api/animal/domain/enums/animal-sort.enum";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { SetAnimalBlindUseCase } from "src/hb-backend-api/animal/domain/ports/in/set-animal-blind.use-case";

/**
 * Content blind: an operator hides a reported animal from public discovery
 * (search) while it stays retrievable by id. Reversible; non-operators refused.
 */
describe("Animal blind (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let setBlind: SetAnimalBlindUseCase;
  let animalQuery: AnimalQueryPort;
  let userModel: Model<UserEntity>;
  let animalModel: Model<AnimalEntity>;

  const shelterId = new Types.ObjectId();
  let seq = 0;

  const seedUser = async (
    roles: UserRole[] = [UserRole.USER],
  ): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `u-${seq}`,
      email: `u-${id.toHexString()}@example.com`,
      passwordHash: "hashed",
      realNameEnc: "enc",
      phoneEnc: "enc",
      verifiedChannel: VerifiedChannel.EMAIL,
      roles,
      shelterRoles: [],
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id.toHexString();
  };

  const seedAnimal = async (name: string): Promise<string> => {
    const id = new Types.ObjectId();
    await animalModel.create({
      _id: id,
      shelterId,
      name,
      species: AnimalSpecies.DOG,
      traits: { sex: AnimalSex.MALE, size: AnimalSize.MEDIUM },
      health: { neutered: true, vaccinated: true },
      intake: { intakeDate: new Date("2026-06-01T00:00:00Z") },
      status: AnimalStatus.AVAILABLE,
      blinded: false,
      version: 0,
    });
    return id.toHexString();
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

    setBlind = app.get(DIToken.AnimalModule.SetAnimalBlindUseCase);
    animalQuery = app.get(DIToken.AnimalModule.AnimalQueryPort);
    userModel = app.get(getModelToken(UserEntity.name));
    animalModel = app.get(getModelToken(AnimalEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const searchNames = async (): Promise<string[]> => {
    const page = await animalQuery.search({
      limit: 50,
      sort: AnimalSort.LATEST,
    });
    return page.items.map((a) => a.getName);
  };

  it("blinds an animal out of discovery and reveals it again", async () => {
    const admin = await seedUser([UserRole.USER, UserRole.SYSTEM_ADMIN]);
    const keep = await seedAnimal("초코");
    const target = await seedAnimal("나비");

    expect(await searchNames()).toEqual(
      expect.arrayContaining(["초코", "나비"]),
    );

    await setBlind.invoke({ animalId: target, actorId: admin, blinded: true });

    const afterBlind = await searchNames();
    expect(afterBlind).toContain("초코");
    expect(afterBlind).not.toContain("나비"); // hidden from search

    // still retrievable by id, flagged blinded
    const byId = await animalQuery.findById(AnimalId.fromString(target));
    expect(byId?.isBlinded()).toBe(true);
    expect(keep).toBeDefined();

    await setBlind.invoke({ animalId: target, actorId: admin, blinded: false });
    expect(await searchNames()).toContain("나비"); // back in discovery
  });

  it("refuses a non-operator", async () => {
    const outsider = await seedUser();
    const target = await seedAnimal("바둑이");
    await expect(
      setBlind.invoke({ animalId: target, actorId: outsider, blinded: true }),
    ).rejects.toThrow("운영자");
  });

  it("sorts by LATEST (default) and OLDEST", async () => {
    await seedAnimal("정렬-A");
    await seedAnimal("정렬-B");
    await seedAnimal("정렬-C"); // created last

    const latest = await animalQuery.search({
      limit: 3,
      keyword: "정렬-",
      sort: AnimalSort.LATEST,
    });
    expect(latest.items.map((a) => a.getName)).toEqual([
      "정렬-C",
      "정렬-B",
      "정렬-A",
    ]);

    const oldest = await animalQuery.search({
      limit: 3,
      keyword: "정렬-",
      sort: AnimalSort.OLDEST,
    });
    expect(oldest.items.map((a) => a.getName)).toEqual([
      "정렬-A",
      "정렬-B",
      "정렬-C",
    ]);
  });
});
