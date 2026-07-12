import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { PostMessageUseCase } from "src/hb-backend-api/messaging/domain/ports/in/post-message.use-case";
import { ListConversationMessagesUseCase } from "src/hb-backend-api/messaging/domain/ports/in/list-conversation-messages.use-case";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { ShelterRole } from "src/hb-backend-api/user/domain/model/shelter-role";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

/**
 * End-to-end slice: a conversation on an adoption application. Proves the
 * resolver registry (adoption plugs in its participant resolver) and the fresh
 * participant authorization — applicant and shelter staff can talk, outsiders
 * can't — through the real DI graph.
 */
describe("Messaging (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let postMessage: PostMessageUseCase;
  let listMessages: ListConversationMessagesUseCase;
  let userModel: Model<UserEntity>;
  let applicationModel: Model<AdoptionApplicationEntity>;

  let seq = 0;
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

  const seedAdoptionApplication = async (
    shelterId: Types.ObjectId,
    applicantId: Types.ObjectId,
  ): Promise<string> => {
    const id = new Types.ObjectId();
    await applicationModel.create({
      _id: id,
      animalId: new Types.ObjectId(),
      shelterId,
      applicantId,
      questionnaireVersion: 1,
      answers: [],
      status: AdoptionApplicationStatus.PENDING,
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

    postMessage = app.get(DIToken.MessagingModule.PostMessageUseCase);
    listMessages = app.get(
      DIToken.MessagingModule.ListConversationMessagesUseCase,
    );
    userModel = app.get(getModelToken(UserEntity.name));
    applicationModel = app.get(getModelToken(AdoptionApplicationEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("lets the applicant and the shelter staff converse, in order", async () => {
    const shelterId = new Types.ObjectId();
    const applicant = await seedUser();
    const staff = await seedUser([{ shelterId, role: UserRole.SHELTER_STAFF }]);
    const subjectRef = await seedAdoptionApplication(shelterId, applicant);

    await postMessage.invoke({
      subjectType: MessageSubjectType.ADOPTION,
      subjectRef,
      senderId: applicant.toHexString(),
      body: "안녕하세요, 입양 문의드려요.",
    });
    await postMessage.invoke({
      subjectType: MessageSubjectType.ADOPTION,
      subjectRef,
      senderId: staff.toHexString(),
      body: "네, 안내드릴게요.",
    });

    const messages = await listMessages.invoke({
      subjectType: MessageSubjectType.ADOPTION,
      subjectRef,
      readerId: applicant.toHexString(),
    });
    expect(messages).toHaveLength(2);
    expect(messages[0].getSenderRole).toBe(MessageSenderRole.APPLICANT);
    expect(messages[1].getSenderRole).toBe(MessageSenderRole.SHELTER);
    expect(messages[0].getSentAt).toBeInstanceOf(Date);
  });

  it("forbids a non-participant from posting or reading", async () => {
    const shelterId = new Types.ObjectId();
    const applicant = await seedUser();
    const subjectRef = await seedAdoptionApplication(shelterId, applicant);
    const outsider = await seedUser();

    await expect(
      postMessage.invoke({
        subjectType: MessageSubjectType.ADOPTION,
        subjectRef,
        senderId: outsider.toHexString(),
        body: "끼어들기",
      }),
    ).rejects.toThrow("참여할 수 없어요");

    await expect(
      listMessages.invoke({
        subjectType: MessageSubjectType.ADOPTION,
        subjectRef,
        readerId: outsider.toHexString(),
      }),
    ).rejects.toThrow("참여할 수 없어요");
  });

  it("returns not-found for an unknown subject", async () => {
    const applicant = await seedUser();
    await expect(
      postMessage.invoke({
        subjectType: MessageSubjectType.ADOPTION,
        subjectRef: new Types.ObjectId().toHexString(),
        senderId: applicant.toHexString(),
        body: "안녕하세요",
      }),
    ).rejects.toThrow("찾을 수 없어요");
  });
});
