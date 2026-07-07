import { INestApplication } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { RefreshTokenEntity } from "src/hb-backend-api/auth/domain/model/refresh-token.entity";
import { RefreshTokenSchema } from "src/hb-backend-api/auth/domain/model/refresh-token.schema";
import { RefreshTokenRepositoryImpl } from "src/hb-backend-api/auth/infra/repositories/refresh-token.repository.impl";

describe("RefreshTokenRepositoryImpl", () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication;
  let repository: RefreshTokenRepositoryImpl;

  const create = (over: { jti: string; familyId: string; userId?: string }) =>
    repository.create({
      jti: over.jti,
      familyId: over.familyId,
      userId: over.userId ?? "user-1",
      expiresAt: new Date(Date.now() + 60_000),
    });

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: RefreshTokenEntity.name, schema: RefreshTokenSchema },
        ]),
      ],
      providers: [RefreshTokenRepositoryImpl],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    repository = app.get(RefreshTokenRepositoryImpl);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("creates and finds a token by jti (ACTIVE)", async () => {
    await create({ jti: "j1", familyId: "f1" });
    const found = await repository.findByJti("j1");
    expect(found).toMatchObject({ jti: "j1", familyId: "f1" });
    expect(found?.isActive()).toBe(true);
    expect(await repository.findByJti("missing")).toBeNull();
  });

  it("marks a token rotated", async () => {
    await create({ jti: "j2", familyId: "f2" });
    await repository.markRotated("j2");
    expect((await repository.findByJti("j2"))?.isRotated()).toBe(true);
  });

  it("revokes every token in a family", async () => {
    await create({ jti: "j3a", familyId: "f3" });
    await create({ jti: "j3b", familyId: "f3" });
    await create({ jti: "other", familyId: "f4" });

    await repository.revokeFamily("f3");

    expect((await repository.findByJti("j3a"))?.isRevoked()).toBe(true);
    expect((await repository.findByJti("j3b"))?.isRevoked()).toBe(true);
    expect((await repository.findByJti("other"))?.isActive()).toBe(true);
  });
});
