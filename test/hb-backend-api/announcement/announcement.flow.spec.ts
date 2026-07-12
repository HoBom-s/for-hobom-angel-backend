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
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { AnnouncementEntity } from "src/hb-backend-api/announcement/domain/model/announcement.entity";
import { AnnouncementQueryPort } from "src/hb-backend-api/announcement/domain/ports/out/announcement-query.port";
import { PostAnnouncementUseCase } from "src/hb-backend-api/announcement/domain/ports/in/post-announcement.use-case";
import { EditAnnouncementUseCase } from "src/hb-backend-api/announcement/domain/ports/in/edit-announcement.use-case";
import { DeleteAnnouncementUseCase } from "src/hb-backend-api/announcement/domain/ports/in/delete-announcement.use-case";

/**
 * End-to-end shelter-CMS slice through the real DI graph + a Mongo transaction:
 * a verified shelter's staff posts notices (pinned floats to the top), edits and
 * deletes them, while an outsider is refused.
 */
describe("Announcement (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let post: PostAnnouncementUseCase;
  let edit: EditAnnouncementUseCase;
  let remove: DeleteAnnouncementUseCase;
  let announcementQuery: AnnouncementQueryPort;
  let announcementModel: Model<AnnouncementEntity>;
  let userModel: Model<UserEntity>;
  let shelterModel: Model<ShelterEntity>;

  let shelterId: string;
  let staffId: string;

  let seq = 0;
  const seedUser = async (shelterRoles: object[] = []): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await userModel.create({
      _id: id,
      nickname: `u-${seq}`,
      realNameEnc: "enc",
      passwordHash: "hashed",
      phoneEnc: "enc",
      email: `u${seq}@example.com`,
      verifiedChannel: VerifiedChannel.EMAIL,
      roles: [UserRole.USER],
      shelterRoles,
      status: UserStatus.ACTIVE,
      version: 0,
    });
    return id.toHexString();
  };

  const seedShelter = async (status: ShelterStatus): Promise<string> => {
    const id = new Types.ObjectId();
    seq += 1;
    await shelterModel.create({
      _id: id,
      name: `보호소-${seq}`,
      slug: `shelter-${seq}`,
      address: {
        region: "서울",
        city: "강남구",
        roadAddress: "테헤란로 1",
        visibility: AddressVisibility.PARTIAL,
      },
      representatives: [],
      status,
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

    post = app.get(DIToken.AnnouncementModule.PostAnnouncementUseCase);
    edit = app.get(DIToken.AnnouncementModule.EditAnnouncementUseCase);
    remove = app.get(DIToken.AnnouncementModule.DeleteAnnouncementUseCase);
    announcementQuery = app.get(
      DIToken.AnnouncementModule.AnnouncementQueryPort,
    );
    announcementModel = app.get(getModelToken(AnnouncementEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
    shelterModel = app.get(getModelToken(ShelterEntity.name));

    shelterId = await seedShelter(ShelterStatus.VERIFIED);
    staffId = await seedUser([
      {
        shelterId: new Types.ObjectId(shelterId),
        role: UserRole.SHELTER_ADMIN,
      },
    ]);
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("staff posts notices and pinned floats to the top", async () => {
    await post.invoke({
      shelterId,
      authorId: staffId,
      title: "첫 공지",
      body: "안녕하세요.",
      pinned: false,
    });
    const { announcementId } = await post.invoke({
      shelterId,
      authorId: staffId,
      title: "중요 공지",
      body: "고정합니다.",
      pinned: true,
    });

    const list = await announcementQuery.findByShelter(
      ShelterId.fromString(shelterId),
      20,
    );
    expect(list).toHaveLength(2);
    expect(list[0].getId.toString()).toBe(announcementId); // pinned first
    expect(list[0].isPinned).toBe(true);
  });

  it("staff edits a notice (version bumps)", async () => {
    const { announcementId } = await post.invoke({
      shelterId,
      authorId: staffId,
      title: "수정 전",
      body: "before",
      pinned: false,
    });

    await edit.invoke({
      announcementId,
      editorId: staffId,
      title: "수정 후",
      body: "after",
      pinned: true,
    });

    const doc = await announcementModel.findById(announcementId).lean().exec();
    expect(doc?.title).toBe("수정 후");
    expect(doc?.pinned).toBe(true);
    expect(doc?.version).toBe(1);
  });

  it("refuses a non-staff outsider to post", async () => {
    const outsider = await seedUser();
    await expect(
      post.invoke({
        shelterId,
        authorId: outsider,
        title: "몰래 공지",
        body: "안돼요",
        pinned: false,
      }),
    ).rejects.toThrow("담당자");
  });

  it("refuses posting to an unverified shelter", async () => {
    const pending = await seedShelter(ShelterStatus.PENDING_VERIFICATION);
    const pendingStaff = await seedUser([
      { shelterId: new Types.ObjectId(pending), role: UserRole.SHELTER_ADMIN },
    ]);
    await expect(
      post.invoke({
        shelterId: pending,
        authorId: pendingStaff,
        title: "이른 공지",
        body: "아직 검증 전",
        pinned: false,
      }),
    ).rejects.toThrow("검증된 보호소");
  });

  it("staff deletes a notice", async () => {
    const { announcementId } = await post.invoke({
      shelterId,
      authorId: staffId,
      title: "삭제될 공지",
      body: "bye",
      pinned: false,
    });

    await remove.invoke({ announcementId, requesterId: staffId });

    const doc = await announcementModel.findById(announcementId).lean().exec();
    expect(doc).toBeNull();
  });
});
