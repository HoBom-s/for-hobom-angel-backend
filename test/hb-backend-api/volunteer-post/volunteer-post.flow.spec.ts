import {
  ForbiddenException,
  INestApplication,
  NotFoundException,
} from "@nestjs/common";
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
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";
import { PostBlockType } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";
import { CreateVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/create-volunteer-post.use-case";
import { DeleteVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/delete-volunteer-post.use-case";
import { LikeVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/like-volunteer-post.use-case";
import { ReadVolunteerFeedUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/read-volunteer-feed.use-case";
import { CommentVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/comment-volunteer-post.use-case";
import { BookmarkVolunteerPostUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/bookmark-volunteer-post.use-case";
import { ListMyBookmarksUseCase } from "src/hb-backend-api/volunteer-post/domain/ports/in/list-my-bookmarks.use-case";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";
import { VolunteerPostCommentPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-comment.port";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

const text = (t: string) => [{ type: PostBlockType.TEXT, text: t }];

/**
 * §05 volunteer post feed end-to-end: a member writes reviews about a shelter
 * (content blocks with inline images), the public feed keyset-paginates them,
 * likes/comments/bookmarks work, and only the author (or an operator) can
 * delete — proven through the real DI graph and Mongo.
 */
describe("Volunteer post (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let createPost: CreateVolunteerPostUseCase;
  let deletePost: DeleteVolunteerPostUseCase;
  let likePost: LikeVolunteerPostUseCase;
  let readFeed: ReadVolunteerFeedUseCase;
  let commentPost: CommentVolunteerPostUseCase;
  let bookmarkPost: BookmarkVolunteerPostUseCase;
  let listMyBookmarks: ListMyBookmarksUseCase;
  let queryPort: VolunteerPostQueryPort;
  let commentPort: VolunteerPostCommentPort;
  let shelterModel: Model<ShelterEntity>;
  let userModel: Model<UserEntity>;
  let postModel: Model<VolunteerPostEntity>;

  let shelterId: string;

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

  const seedShelter = async (
    status: ShelterStatus = ShelterStatus.VERIFIED,
  ): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await shelterModel.create({
      _id: id,
      name: "행복한 발자국",
      slug: `shelter-${id.toHexString()}`,
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
    commentPost = app.get(
      DIToken.VolunteerPostModule.CommentVolunteerPostUseCase,
    );
    bookmarkPost = app.get(
      DIToken.VolunteerPostModule.BookmarkVolunteerPostUseCase,
    );
    listMyBookmarks = app.get(
      DIToken.VolunteerPostModule.ListMyBookmarksUseCase,
    );
    queryPort = app.get(DIToken.VolunteerPostModule.VolunteerPostQueryPort);
    commentPort = app.get(DIToken.VolunteerPostModule.VolunteerPostCommentPort);
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
    postModel = app.get(getModelToken(VolunteerPostEntity.name));

    shelterId = await seedShelter();
  }, 60_000);

  afterEach(async () => {
    await postModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("publishes a post about a shelter with inline image blocks", async () => {
    const author = await seedUser();
    const { postId } = await createPost.invoke({
      authorId: author,
      shelterId,
      content: [
        { type: PostBlockType.TEXT, text: "산책 봉사 다녀왔어요" },
        { type: PostBlockType.IMAGE, imageKey: "posts/1.webp" },
        { type: PostBlockType.TEXT, text: "행복했어요" },
      ],
    });

    const post = await queryPort.findById(VolunteerPostId.fromString(postId));
    expect(post?.getShelterId.toString()).toBe(shelterId);
    expect(post?.getContent.getBlocks).toHaveLength(3);
    expect(post?.getContent.getBlocks[1]).toEqual({
      type: PostBlockType.IMAGE,
      imageKey: "posts/1.webp",
      caption: null,
    });
    expect(post?.getImageKeys).toEqual(["posts/1.webp"]);

    const feed = await queryPort.findFeed({ limit: 20 });
    expect(feed.items.some((p) => p.getId.toString() === postId)).toBe(true);
  });

  it("refuses a post about a missing or unverified shelter", async () => {
    const author = await seedUser();
    await expect(
      createPost.invoke({
        authorId: author,
        shelterId: new Types.ObjectId().toHexString(),
        content: text("유령 보호소"),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    const pending = await seedShelter(ShelterStatus.PENDING_VERIFICATION);
    await expect(
      createPost.invoke({
        authorId: author,
        shelterId: pending,
        content: text("미검증 보호소"),
      }),
    ).rejects.toThrow("검증된 보호소");
  });

  it("refuses a suspended member", async () => {
    const suspended = await seedUser(UserStatus.SUSPENDED);
    await expect(
      createPost.invoke({
        authorId: suspended,
        shelterId,
        content: text("hi"),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("keyset-paginates the feed newest-first without overlap", async () => {
    const author = await seedUser();
    const ids: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const { postId } = await createPost.invoke({
        authorId: author,
        shelterId,
        content: text(`post-${i}`),
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
      shelterId,
      content: text("좋아요 눌러주세요"),
    });

    let item = await readFeed.one(postId, fan);
    expect(item?.post.getLikeCount).toBe(0);
    expect(item?.liked).toBe(false);

    await likePost.like({ postId, userId: fan });
    await likePost.like({ postId, userId: fan });
    item = await readFeed.one(postId, fan);
    expect(item?.post.getLikeCount).toBe(1);
    expect(item?.liked).toBe(true);

    const authorView = await readFeed.one(postId, author);
    expect(authorView?.post.getLikeCount).toBe(1);
    expect(authorView?.liked).toBe(false);

    await likePost.unlike({ postId, userId: fan });
    await likePost.unlike({ postId, userId: fan });
    item = await readFeed.one(postId, fan);
    expect(item?.post.getLikeCount).toBe(0);
    expect(item?.liked).toBe(false);
  });

  it("comments drive commentCount, list oldest-first, and author-only delete", async () => {
    const author = await seedUser();
    const commenter = await seedUser();
    const { postId } = await createPost.invoke({
      authorId: author,
      shelterId,
      content: text("댓글 달아주세요"),
    });

    const first = await commentPost.create({
      postId,
      authorId: commenter,
      body: "첫 댓글",
    });
    await commentPost.create({ postId, authorId: author, body: "둘째 댓글" });

    let post = await queryPort.findById(VolunteerPostId.fromString(postId));
    expect(post?.getCommentCount).toBe(2);

    const page = await commentPort.listByPost({
      postId: VolunteerPostId.fromString(postId),
      limit: 20,
    });
    expect(page.items.map((c) => c.getBody)).toEqual(["첫 댓글", "둘째 댓글"]);

    const stranger = await seedUser();
    await expect(
      commentPost.delete({ commentId: first.commentId, requesterId: stranger }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await commentPost.delete({
      commentId: first.commentId,
      requesterId: commenter,
    });
    post = await queryPort.findById(VolunteerPostId.fromString(postId));
    expect(post?.getCommentCount).toBe(1);
  });

  it("bookmarks toggle the viewer flag and show up in 'my bookmarks'", async () => {
    const author = await seedUser();
    const saver = await seedUser();
    const a = await createPost.invoke({
      authorId: author,
      shelterId,
      content: text("첫 후기"),
    });
    const b = await createPost.invoke({
      authorId: author,
      shelterId,
      content: text("둘째 후기"),
    });

    let item = await readFeed.one(a.postId, saver);
    expect(item?.bookmarked).toBe(false);

    await bookmarkPost.bookmark({ postId: a.postId, userId: saver });
    await bookmarkPost.bookmark({ postId: a.postId, userId: saver });
    await bookmarkPost.bookmark({ postId: b.postId, userId: saver });

    item = await readFeed.one(a.postId, saver);
    expect(item?.bookmarked).toBe(true);

    const other = await seedUser();
    expect((await readFeed.one(a.postId, other))?.bookmarked).toBe(false);

    const mine = await listMyBookmarks.invoke({ viewerId: saver, limit: 20 });
    expect(mine.items.map((i) => i.post.getId.toString())).toEqual([
      b.postId,
      a.postId,
    ]);
    expect(mine.items.every((i) => i.bookmarked)).toBe(true);

    await bookmarkPost.unbookmark({ postId: a.postId, userId: saver });
    expect((await readFeed.one(a.postId, saver))?.bookmarked).toBe(false);
    const after = await listMyBookmarks.invoke({ viewerId: saver, limit: 20 });
    expect(after.items.map((i) => i.post.getId.toString())).toEqual([b.postId]);
  });

  it("refuses a comment on a missing post", async () => {
    const commenter = await seedUser();
    await expect(
      commentPost.create({
        postId: new Types.ObjectId().toHexString(),
        authorId: commenter,
        body: "유령 후기",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("lets only the author delete their post", async () => {
    const author = await seedUser();
    const stranger = await seedUser();
    const { postId } = await createPost.invoke({
      authorId: author,
      shelterId,
      content: text("지울 후기"),
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
