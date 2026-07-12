import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalDecision } from "src/hb-backend-api/approval/domain/model/vo/approval-decision.vo";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { DecideApprovalUseCase } from "src/hb-backend-api/approval/domain/ports/in/decide-approval.use-case";
import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import { RegisterAnimalUseCase } from "src/hb-backend-api/animal/domain/ports/in/register-animal.use-case";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { QuestionType } from "src/hb-backend-api/questionnaire/domain/enums/question-type.enum";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { DefineQuestionnaireUseCase } from "src/hb-backend-api/questionnaire/domain/ports/in/define-questionnaire.use-case";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { SubmitAdoptionApplicationUseCase } from "src/hb-backend-api/adoption/domain/ports/in/submit-adoption-application.use-case";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { TrustTier } from "src/hb-backend-api/shelter/domain/enums/trust-tier.enum";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { ShelterRole } from "src/hb-backend-api/user/domain/model/shelter-role";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

/**
 * End-to-end slice: an admin defines the adoption survey, a member applies (which
 * reserves the animal), and the decision adopts or releases. Proves the approval
 * engine's third consumer drives the Animal aggregate's transitions through the
 * real DI graph and a Mongo transaction.
 */
describe("Adoption procedure (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let registerAnimal: RegisterAnimalUseCase;
  let defineQuestionnaire: DefineQuestionnaireUseCase;
  let submitApplication: SubmitAdoptionApplicationUseCase;
  let decideApproval: DecideApprovalUseCase;
  let animalModel: Model<AnimalEntity>;
  let applicationModel: Model<AdoptionApplicationEntity>;
  let shelterModel: Model<ShelterEntity>;
  let userModel: Model<UserEntity>;
  let outboxModel: Model<OutboxEntity>;

  let seq = 0;

  const seedShelter = async (): Promise<Types.ObjectId> => {
    const id = new Types.ObjectId();
    seq += 1;
    await shelterModel.create({
      _id: id,
      name: "행복한 발자국",
      slug: `shelter-${seq}`,
      address: {
        region: "서울",
        city: "강남구",
        roadAddress: "테헤란로 1",
        lat: null,
        lng: null,
        visibility: AddressVisibility.PARTIAL,
      },
      representatives: [],
      status: ShelterStatus.VERIFIED,
      trustTier: TrustTier.A,
      version: 0,
    });
    return id;
  };

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

  /** A verified shelter with an admin, an applicant, an available animal, and a
   *  one-question required survey. */
  const setup = async () => {
    const shelterId = await seedShelter();
    const adminId = await seedUser([
      { shelterId, role: UserRole.SHELTER_ADMIN },
    ]);
    const applicantId = await seedUser();

    const { animalId } = await registerAnimal.invoke({
      shelterId: shelterId.toHexString(),
      registeredBy: adminId.toHexString(),
      name: "초코",
      species: AnimalSpecies.DOG,
      traits: { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL },
      health: { neutered: true, vaccinated: true },
      intake: { intakeDate: new Date("2026-01-02") },
    });

    await defineQuestionnaire.invoke({
      shelterId: shelterId.toHexString(),
      purpose: QuestionnairePurpose.ADOPTION,
      definedBy: adminId.toHexString(),
      questions: [
        {
          id: "exp",
          prompt: "반려 경험이 있나요?",
          type: QuestionType.BOOLEAN,
          required: true,
        },
      ],
    });

    return { shelterId, adminId, applicantId, animalId };
  };

  const validAnswers = [{ questionId: "exp", values: ["true"] }];

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

    registerAnimal = app.get(DIToken.AnimalModule.RegisterAnimalUseCase);
    defineQuestionnaire = app.get(
      DIToken.QuestionnaireModule.DefineQuestionnaireUseCase,
    );
    submitApplication = app.get(
      DIToken.AdoptionModule.SubmitAdoptionApplicationUseCase,
    );
    decideApproval = app.get(DIToken.ApprovalModule.DecideApprovalUseCase);
    animalModel = app.get(getModelToken(AnimalEntity.name));
    applicationModel = app.get(getModelToken(AdoptionApplicationEntity.name));
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
    outboxModel = app.get(getModelToken(OutboxEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("reserves the animal and opens a pending application on submit", async () => {
    const { applicantId, animalId } = await setup();

    const { applicationId } = await submitApplication.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
    });

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.RESERVED);
    const application = await applicationModel
      .findById(applicationId)
      .lean()
      .exec();
    expect(application?.status).toBe(AdoptionApplicationStatus.PENDING);
    expect(application?.questionnaireVersion).toBe(1);
  });

  it("adopts the animal and approves the application on approval", async () => {
    const { applicantId, animalId } = await setup();
    const { applicationId, approvalId } = await submitApplication.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
    });

    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: "operator-1",
      decision: ApprovalDecision.approve(),
    });

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.ADOPTED);
    const application = await applicationModel
      .findById(applicationId)
      .lean()
      .exec();
    expect(application?.status).toBe(AdoptionApplicationStatus.APPROVED);

    const events = await outboxModel
      .find({ eventType: EventType.ADOPTION_APPROVED })
      .lean()
      .exec();
    const mine = events.filter(
      (e) => e.payload.recipientUserId === applicantId.toHexString(),
    );
    expect(mine).toHaveLength(1);
  });

  it("releases the animal and rejects the application on rejection", async () => {
    const { applicantId, animalId } = await setup();
    const { applicationId, approvalId } = await submitApplication.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
    });

    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: "operator-1",
      decision: ApprovalDecision.reject(),
      reason: "조건이 맞지 않아요.",
    });

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.AVAILABLE);
    const application = await applicationModel
      .findById(applicationId)
      .lean()
      .exec();
    expect(application?.status).toBe(AdoptionApplicationStatus.REJECTED);
  });

  it("rejects a submission that fails the required survey", async () => {
    const { applicantId, animalId } = await setup();

    await expect(
      submitApplication.invoke({
        animalId,
        applicantId: applicantId.toHexString(),
        answers: [],
      }),
    ).rejects.toThrow("필수");

    // The animal was not reserved by the failed attempt.
    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.AVAILABLE);
  });

  it("refuses a second application while one is in progress", async () => {
    const { applicantId, animalId } = await setup();
    await submitApplication.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
    });

    const otherApplicant = await seedUser();
    await expect(
      submitApplication.invoke({
        animalId,
        applicantId: otherApplicant.toHexString(),
        answers: validAnswers,
      }),
    ).rejects.toThrow("받을 수 없어요");
  });
});
