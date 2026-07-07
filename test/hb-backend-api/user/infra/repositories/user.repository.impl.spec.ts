import { INestApplication } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { UserSchema } from "src/hb-backend-api/user/domain/model/user.schema";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserRepositoryImpl } from "src/hb-backend-api/user/infra/repositories/user.repository.impl";

/**
 * Repository-level test: UserRepositoryImpl against a real Mongo. Verifies the
 * document mapping and query paths in isolation from the adapter/domain layers.
 */
describe("UserRepositoryImpl", () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication;
  let repository: UserRepositoryImpl;

  const sampleDoc = (over: Partial<UserEntity> = {}): Partial<UserEntity> => ({
    nickname: "hobom",
    realNameEnc: "enc-name",
    ci: "ci-value",
    phoneEnc: "enc-phone",
    email: "hobom@example.com",
    verifiedChannel: VerifiedChannel.PHONE,
    roles: [UserRole.USER],
    shelterRoles: [],
    status: UserStatus.ACTIVE,
    ...over,
  });

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: UserEntity.name, schema: UserSchema },
        ]),
      ],
      providers: [UserRepositoryImpl],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    repository = app.get(UserRepositoryImpl);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("inserts and finds by id / nickname / ci", async () => {
    const created = await repository.insert(
      sampleDoc({ nickname: "finder", ci: "ci-finder" }),
    );

    expect((await repository.findById(created._id))?.nickname).toBe("finder");
    expect((await repository.findByNickname("finder"))?.ci).toBe("ci-finder");
    expect((await repository.findByCi("ci-finder"))?.nickname).toBe("finder");
  });

  it("returns null when nothing matches", async () => {
    expect(await repository.findByNickname("ghost")).toBeNull();
    expect(await repository.findByCi("ghost")).toBeNull();
  });

  it("updates the authz patch and bumps the version at the expected version", async () => {
    const created = await repository.insert(
      sampleDoc({ nickname: "patcher", ci: "ci-patch" }),
    );
    expect(created.version).toBe(0);

    await repository.update(created._id, 0, {
      roles: [UserRole.USER, UserRole.SYSTEM_ADMIN],
      status: UserStatus.WITHDRAWN,
    });

    const reloaded = await repository.findById(created._id);
    expect(reloaded?.roles).toEqual([UserRole.USER, UserRole.SYSTEM_ADMIN]);
    expect(reloaded?.status).toBe(UserStatus.WITHDRAWN);
    expect(reloaded?.version).toBe(1); // bumped
    expect(reloaded?.email).toBe("hobom@example.com"); // untouched fields survive
  });

  it("rejects a stale update (optimistic lock)", async () => {
    const created = await repository.insert(
      sampleDoc({ nickname: "racer", ci: "ci-race" }),
    );

    // first writer wins (version 0 -> 1)
    await repository.update(created._id, 0, { status: UserStatus.DORMANT });

    // second writer still holds version 0 -> must be rejected
    await expect(
      repository.update(created._id, 0, { status: UserStatus.WITHDRAWN }),
    ).rejects.toThrow(OptimisticLockException);

    const reloaded = await repository.findById(created._id);
    expect(reloaded?.status).toBe(UserStatus.DORMANT);
    expect(reloaded?.version).toBe(1);
  });
});
