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
import { FaqEntity } from "src/hb-backend-api/faq/domain/model/faq.entity";
import { FaqQueryPort } from "src/hb-backend-api/faq/domain/ports/out/faq-query.port";
import { PostFaqUseCase } from "src/hb-backend-api/faq/domain/ports/in/post-faq.use-case";
import { EditFaqUseCase } from "src/hb-backend-api/faq/domain/ports/in/edit-faq.use-case";
import { DeleteFaqUseCase } from "src/hb-backend-api/faq/domain/ports/in/delete-faq.use-case";

/**
 * End-to-end shelter-CMS FAQ slice through the real DI graph + a Mongo
 * transaction: a verified shelter's staff posts FAQ entries (rendered by
 * ascending order), edits and deletes them, while an outsider is refused.
 */
describe("Faq (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let post: PostFaqUseCase;
  let edit: EditFaqUseCase;
  let remove: DeleteFaqUseCase;
  let faqQuery: FaqQueryPort;
  let faqModel: Model<FaqEntity>;
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
      email: `u-${id.toHexString()}@example.com`,
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

    post = app.get(DIToken.FaqModule.PostFaqUseCase);
    edit = app.get(DIToken.FaqModule.EditFaqUseCase);
    remove = app.get(DIToken.FaqModule.DeleteFaqUseCase);
    faqQuery = app.get(DIToken.FaqModule.FaqQueryPort);
    faqModel = app.get(getModelToken(FaqEntity.name));
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

  it("staff posts entries returned in ascending order", async () => {
    await post.invoke({
      shelterId,
      authorId: staffId,
      question: "두번째",
      answer: "a2",
      order: 2,
    });
    const { faqId } = await post.invoke({
      shelterId,
      authorId: staffId,
      question: "첫번째",
      answer: "a1",
      order: 1,
    });

    const list = await faqQuery.findByShelter(
      ShelterId.fromString(shelterId),
      50,
    );
    expect(list).toHaveLength(2);
    expect(list[0].getId.toString()).toBe(faqId); // order 1 first
    expect(list[0].getOrder).toBe(1);
  });

  it("staff edits an entry (version bumps)", async () => {
    const { faqId } = await post.invoke({
      shelterId,
      authorId: staffId,
      question: "수정 전",
      answer: "before",
      order: 5,
    });

    await edit.invoke({
      faqId,
      editorId: staffId,
      question: "수정 후",
      answer: "after",
      order: 0,
    });

    const doc = await faqModel.findById(faqId).lean().exec();
    expect(doc?.question).toBe("수정 후");
    expect(doc?.order).toBe(0);
    expect(doc?.version).toBe(1);
  });

  it("refuses a non-staff outsider to post", async () => {
    const outsider = await seedUser();
    await expect(
      post.invoke({
        shelterId,
        authorId: outsider,
        question: "몰래",
        answer: "안돼요",
        order: 0,
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
        question: "이른 FAQ",
        answer: "검증 전",
        order: 0,
      }),
    ).rejects.toThrow("검증된 보호소");
  });

  it("staff deletes an entry", async () => {
    const { faqId } = await post.invoke({
      shelterId,
      authorId: staffId,
      question: "삭제될",
      answer: "bye",
      order: 9,
    });

    await remove.invoke({ faqId, requesterId: staffId });

    const doc = await faqModel.findById(faqId).lean().exec();
    expect(doc).toBeNull();
  });
});
