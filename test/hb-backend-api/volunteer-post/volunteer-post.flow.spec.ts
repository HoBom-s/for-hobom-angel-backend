import { ForbiddenException, INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";
import { CreateVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/create-volunteer-post.use-case";
import { DeleteVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/delete-volunteer-post.use-case";
import { LikeVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/like-volunteer-post.use-case";
import { ReadVolunteerFeedUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

/**
 * §05 volunteer post feed end-to-end: a member writes reviews, the public feed
 * keyset-paginates them newest-first, and only the author (or an operator) can
 * delete — proven through the real DI graph and Mongo.
 */
describe("Volunteer post (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let createPost: CreateVolunteerPostUseCase;
  let deletePost: DeleteVolunteerPostUseCase;
  let likePost: LikeVolunteerPostUseCase;
  let readFeed: ReadVolunteerFeedUseCase;
  let queryPort: VolunteerPostQueryPort;
  let userModel: Model<UserEntity>;
  let postModel: Model<VolunteerPostEntity>;

  let seq = 0;
  const seedUser = async (
    status: UserStatus = UserStatus.ACTIVE,
  ): Promise<string> => {
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
      status,
      version: 0,
    });
    return id.toHexString();
  };

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB = mongo.getUri();
    process.env.NODE_ENV = "test";
    process.env.HOBOM_JWT_SECRET = "s";
    process.env.HOBOM_JWT_REFRESH_SECRET = "r";
    process.env.HOBOM_JWT_ACCESS_TOKEN_EXPIRED = "15m";
    process.env.HOBOM_JWT_REFRESH_TOKEN_EXPIRED = "30d";
    process.env.FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

    const { AppModule } = await import("src/app.module");
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    createPost = app.get(
      DIToken.VolunteerPostModule.CreateVolunteerPostUseCase,
    );
    deletePost = app.get(
      DIToken.VolunteerPostModule.DeleteVolunteerPostUseCase,
    );
    likePost = app.get(DIToken.VolunteerPostModule.LikeVolunteerPostUseCase);
    readFeed = app.get(DIToken.VolunteerPostModule.ReadVolunteerFeedUseCase);
    queryPort = app.get(DIToken.VolunteerPostModule.VolunteerPostQueryPort);
    userModel = app.get(getModelToken(UserEntity.name));
    postModel = app.get(getModelToken(VolunteerPostEntity.name));
  }, 60_000);

  afterEach(async () => {
    await postModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("publishes a post and reads it back on the feed with its images", async () => {
    const author = await seedUser();
    const { postId } = await createPost.invoke({
      authorId: author,
      body: "산책 봉사 다녀왔어요",
      imageKeys: ["posts/1.webp"],
    });

    const post = await queryPort.findById(VolunteerPostId.fromString(postId));
    expect(post?.getBody).toBe("산책 봉사 다녀왔어요");
    expect(post?.getImageKeys).toEqual(["posts/1.webp"]);

    const feed = await queryPort.findFeed({ limit: 20 });
    expect(feed.items.some((p) => p.getId.toString() === postId)).toBe(true);
  });

  it("refuses a suspended member", async () => {
    const suspended = await seedUser(UserStatus.SUSPENDED);
    await expect(
      createPost.invoke({ authorId: suspended, body: "hi" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("keyset-paginates the feed newest-first without overlap", async () => {
    await userModel.deleteMany({}).exec();
    const author = await seedUser();
    const ids: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const { postId } = await createPost.invoke({
        authorId: author,
        body: `post-${i}`,
      });
      ids.push(postId);
    }
    const expectedOrder = [...ids].reverse();

    const first = await queryPort.findFeed({ limit: 2 });
    expect(first.items.map((p) => p.getId.toString())).toEqual(
      expectedOrder.slice(0, 2),
    );
    expect(first.hasNext).toBe(true);

    const second = await queryPort.findFeed({
      cursor: first.nextCursor ?? undefined,
      limit: 2,
    });
    expect(second.items.map((p) => p.getId.toString())).toEqual(
      expectedOrder.slice(2),
    );
    expect(second.hasNext).toBe(false);
  });

  it("likes are idempotent and reflected in likeCount + the viewer's liked flag", async () => {
    const author = await seedUser();
    const fan = await seedUser();
    const { postId } = await createPost.invoke({
      authorId: author,
      body: "좋아요 눌러주세요",
    });

    // Not liked yet.
    let item = await readFeed.one(postId, fan);
    expect(item?.post.getLikeCount).toBe(0);
    expect(item?.liked).toBe(false);

    // Like twice — idempotent, count stays 1.
    await likePost.like({ postId, userId: fan });
    await likePost.like({ postId, userId: fan });
    item = await readFeed.one(postId, fan);
    expect(item?.post.getLikeCount).toBe(1);
    expect(item?.liked).toBe(true);

    // The author viewing the same post hasn't liked it.
    const authorView = await readFeed.one(postId, author);
    expect(authorView?.post.getLikeCount).toBe(1);
    expect(authorView?.liked).toBe(false);

    // Unlike twice — count floors at 0.
    await likePost.unlike({ postId, userId: fan });
    await likePost.unlike({ postId, userId: fan });
    item = await readFeed.one(postId, fan);
    expect(item?.post.getLikeCount).toBe(0);
    expect(item?.liked).toBe(false);
  });

  it("lets only the author delete their post", async () => {
    const author = await seedUser();
    const stranger = await seedUser();
    const { postId } = await createPost.invoke({
      authorId: author,
      body: "지울 후기",
    });

    await expect(
      deletePost.invoke({ postId, requesterId: stranger }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await deletePost.invoke({ postId, requesterId: author });
    expect(
      await queryPort.findById(VolunteerPostId.fromString(postId)),
    ).toBeNull();
  });
});
