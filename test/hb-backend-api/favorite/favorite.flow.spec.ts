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
import { FavoriteTargetType } from "src/hb-backend-api/favorite/domain/enums/favorite-target-type.enum";
import { AddFavoriteUseCase } from "src/hb-backend-api/favorite/domain/ports/in/add-favorite.use-case";
import { RemoveFavoriteUseCase } from "src/hb-backend-api/favorite/domain/ports/in/remove-favorite.use-case";
import { ListFavoritesUseCase } from "src/hb-backend-api/favorite/domain/ports/in/list-favorites.use-case";

/**
 * End-to-end slice: favoriting animals and shelters. Proves idempotent add,
 * type-filtered list, and remove through the real DI graph.
 */
describe("Favorites (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let addFavorite: AddFavoriteUseCase;
  let removeFavorite: RemoveFavoriteUseCase;
  let listFavorites: ListFavoritesUseCase;
  let userModel: Model<UserEntity>;

  let seq = 0;
  const seedUser = async (): Promise<string> => {
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
      shelterRoles: [],
      status: UserStatus.ACTIVE,
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

    addFavorite = app.get(DIToken.FavoriteModule.AddFavoriteUseCase);
    removeFavorite = app.get(DIToken.FavoriteModule.RemoveFavoriteUseCase);
    listFavorites = app.get(DIToken.FavoriteModule.ListFavoritesUseCase);
    userModel = app.get(getModelToken(UserEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("adds idempotently, lists by type, and removes", async () => {
    const userId = await seedUser();
    const animal = new Types.ObjectId().toHexString();
    const animal2 = new Types.ObjectId().toHexString();
    const shelter = new Types.ObjectId().toHexString();

    // idempotent: favoriting the same animal twice keeps one
    await addFavorite.invoke({
      userId,
      targetType: FavoriteTargetType.ANIMAL,
      targetRef: animal,
    });
    await addFavorite.invoke({
      userId,
      targetType: FavoriteTargetType.ANIMAL,
      targetRef: animal,
    });
    await addFavorite.invoke({
      userId,
      targetType: FavoriteTargetType.ANIMAL,
      targetRef: animal2,
    });
    await addFavorite.invoke({
      userId,
      targetType: FavoriteTargetType.SHELTER,
      targetRef: shelter,
    });

    expect(await listFavorites.invoke({ userId })).toHaveLength(3);
    expect(
      await listFavorites.invoke({
        userId,
        targetType: FavoriteTargetType.ANIMAL,
      }),
    ).toHaveLength(2);
    expect(
      await listFavorites.invoke({
        userId,
        targetType: FavoriteTargetType.SHELTER,
      }),
    ).toHaveLength(1);

    await removeFavorite.invoke({
      userId,
      targetType: FavoriteTargetType.ANIMAL,
      targetRef: animal,
    });
    expect(
      await listFavorites.invoke({
        userId,
        targetType: FavoriteTargetType.ANIMAL,
      }),
    ).toHaveLength(1);
  });
});
