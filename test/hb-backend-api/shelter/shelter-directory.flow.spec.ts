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
import { ListSheltersUseCase } from "src/hb-backend-api/shelter/domain/ports/in/list-shelters.use-case";

/**
 * §04 directory: lists only VERIFIED shelters, newest first, keyset-paginated on
 * _id, with an optional region filter. Proves the query port + repository +
 * cursor slicing behave against a real Mongo, not just in a mock.
 */
describe("Shelter directory list (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let listShelters: ListSheltersUseCase;
  let shelterModel: Model<ShelterEntity>;

  let seq = 0;
  const seedShelter = async (params: {
    status: ShelterStatus;
    region: string;
    coverImageKey?: string;
    name?: string;
  }): Promise<Types.ObjectId> => {
    const id = new Types.ObjectId();
    seq += 1;
    await shelterModel.create({
      _id: id,
      name: params.name ?? `보호소-${seq}`,
      slug: `dir-${id.toHexString()}`,
      address: {
        region: params.region,
        city: "강남구",
        roadAddress: `테헤란로 ${seq}`,
        lat: null,
        lng: null,
        visibility: AddressVisibility.PARTIAL,
      },
      status: params.status,
      trustTier: TrustTier.A,
      version: 0,
      profile: params.coverImageKey
        ? { coverImageKey: params.coverImageKey }
        : {},
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

    listShelters = app.get(DIToken.ShelterModule.ListSheltersUseCase);
    shelterModel = app.get(getModelToken(ShelterEntity.name));
  }, 60_000);

  afterEach(async () => {
    await shelterModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("returns only verified shelters, newest first, carrying the cover image", async () => {
    await seedShelter({
      status: ShelterStatus.PENDING_VERIFICATION,
      region: "서울",
    });
    const verified = await seedShelter({
      status: ShelterStatus.VERIFIED,
      region: "서울",
      coverImageKey: "shelters/cover.webp",
    });

    const page = await listShelters.invoke({ limit: 20 });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].getId.toString()).toBe(verified.toHexString());
    expect(page.items[0].getProfile.getCoverImageKey).toBe(
      "shelters/cover.webp",
    );
    expect(page.hasNext).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it("filters by region", async () => {
    await seedShelter({ status: ShelterStatus.VERIFIED, region: "서울" });
    const busan = await seedShelter({
      status: ShelterStatus.VERIFIED,
      region: "부산",
    });

    const page = await listShelters.invoke({ region: "부산", limit: 20 });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].getId.toString()).toBe(busan.toHexString());
  });

  it("searches by name (case-insensitive substring)", async () => {
    await seedShelter({
      status: ShelterStatus.VERIFIED,
      region: "서울",
      name: "행복한 발자국",
    });
    const target = await seedShelter({
      status: ShelterStatus.VERIFIED,
      region: "서울",
      name: "우리동네 냥이쉼터",
    });

    const page = await listShelters.invoke({ keyword: "냥이", limit: 20 });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].getId.toString()).toBe(target.toHexString());
  });

  it("treats regex metacharacters in the keyword literally", async () => {
    await seedShelter({
      status: ShelterStatus.VERIFIED,
      region: "서울",
      name: "행복한 발자국",
    });

    // '.*' must match a literal substring, not act as a wildcard.
    const page = await listShelters.invoke({ keyword: ".*", limit: 20 });
    expect(page.items).toHaveLength(0);
  });

  it("combines region and name filters", async () => {
    await seedShelter({
      status: ShelterStatus.VERIFIED,
      region: "부산",
      name: "행복 보호소",
    });
    const seoulHappy = await seedShelter({
      status: ShelterStatus.VERIFIED,
      region: "서울",
      name: "행복 보호소",
    });

    const page = await listShelters.invoke({
      region: "서울",
      keyword: "행복",
      limit: 20,
    });

    expect(page.items).toHaveLength(1);
    expect(page.items[0].getId.toString()).toBe(seoulHappy.toHexString());
  });

  it("keyset-paginates across pages without overlap", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const id = await seedShelter({
        status: ShelterStatus.VERIFIED,
        region: "서울",
      });
      ids.push(id.toHexString());
    }
    // Newest-first: the last seeded id comes first.
    const expectedOrder = [...ids].reverse();

    const first = await listShelters.invoke({ limit: 2 });
    expect(first.items.map((s) => s.getId.toString())).toEqual(
      expectedOrder.slice(0, 2),
    );
    expect(first.hasNext).toBe(true);
    expect(first.nextCursor).toBe(expectedOrder[1]);

    const second = await listShelters.invoke({
      cursor: first.nextCursor ?? undefined,
      limit: 2,
    });
    expect(second.items.map((s) => s.getId.toString())).toEqual(
      expectedOrder.slice(2),
    );
    expect(second.hasNext).toBe(false);
    expect(second.nextCursor).toBeNull();
  });
});
