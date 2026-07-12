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
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
import { SubmitFosterApplicationUseCase } from "src/hb-backend-api/foster/domain/ports/in/submit-foster-application.use-case";
import { TerminateFosterUseCase } from "src/hb-backend-api/foster/domain/ports/in/terminate-foster.use-case";
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
 * End-to-end slice: define the foster survey, apply (reserves the animal),
 * approve (FOSTERED), then terminate (back to AVAILABLE + notification). Proves
 * the approval engine's fourth consumer and the foster termination path through
 * the real DI graph and Mongo transactions.
 */
describe("Foster procedure (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  let registerAnimal: RegisterAnimalUseCase;
  let defineQuestionnaire: DefineQuestionnaireUseCase;
  let submitFoster: SubmitFosterApplicationUseCase;
  let terminateFoster: TerminateFosterUseCase;
  let decideApproval: DecideApprovalUseCase;
  let animalModel: Model<AnimalEntity>;
  let applicationModel: Model<FosterApplicationEntity>;
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
      purpose: QuestionnairePurpose.FOSTER,
      definedBy: adminId.toHexString(),
      questions: [
        {
          id: "home",
          prompt: "임시보호 가능한 주거 형태는?",
          type: QuestionType.SINGLE_CHOICE,
          options: ["apartment", "house"],
          required: true,
        },
      ],
    });

    return { shelterId, adminId, applicantId, animalId };
  };

  const validAnswers = [{ questionId: "home", values: ["apartment"] }];

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
    submitFoster = app.get(DIToken.FosterModule.SubmitFosterApplicationUseCase);
    terminateFoster = app.get(DIToken.FosterModule.TerminateFosterUseCase);
    decideApproval = app.get(DIToken.ApprovalModule.DecideApprovalUseCase);
    animalModel = app.get(getModelToken(AnimalEntity.name));
    applicationModel = app.get(getModelToken(FosterApplicationEntity.name));
    shelterModel = app.get(getModelToken(ShelterEntity.name));
    userModel = app.get(getModelToken(UserEntity.name));
    outboxModel = app.get(getModelToken(OutboxEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it("reserves the animal and opens a pending indefinite foster on submit", async () => {
    const { applicantId, animalId } = await setup();

    const { fosterApplicationId } = await submitFoster.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
      plannedEndDate: null,
    });

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.RESERVED);
    const application = await applicationModel
      .findById(fosterApplicationId)
      .lean()
      .exec();
    expect(application?.status).toBe(FosterApplicationStatus.PENDING);
    expect(application?.plannedEndDate ?? null).toBeNull();
  });

  it("fosters on approval, then terminating returns the animal and notifies", async () => {
    const { adminId, applicantId, animalId } = await setup();
    const { fosterApplicationId, approvalId } = await submitFoster.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
      plannedEndDate: new Date("2026-09-01"),
    });

    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: adminId.toHexString(),
      decision: ApprovalDecision.approve(),
    });

    let animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.FOSTERED);

    await terminateFoster.invoke({
      fosterApplicationId,
      terminatedBy: adminId.toHexString(),
      reason: FosterEndReason.EARLY_TERMINATED,
    });

    animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.AVAILABLE);
    const application = await applicationModel
      .findById(fosterApplicationId)
      .lean()
      .exec();
    expect(application?.endReason).toBe(FosterEndReason.EARLY_TERMINATED);
    expect(application?.endedAt).toBeInstanceOf(Date);

    const events = await outboxModel
      .find({ eventType: EventType.FOSTER_TERMINATED })
      .lean()
      .exec();
    const mine = events.filter(
      (e) => e.payload.fosterProcessId === fosterApplicationId,
    );
    expect(mine).toHaveLength(1);
    expect(mine[0].payload.reason).toBe("EARLY_TERMINATED");
  });

  it("releases the animal when the foster decision rejects", async () => {
    const { adminId, applicantId, animalId } = await setup();
    const { approvalId } = await submitFoster.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
    });

    await decideApproval.invoke({
      requestId: ApprovalId.fromString(approvalId),
      actorId: adminId.toHexString(),
      decision: ApprovalDecision.reject(),
      reason: "여건이 맞지 않아요.",
    });

    const animal = await animalModel.findById(animalId).lean().exec();
    expect(animal?.status).toBe(AnimalStatus.AVAILABLE);
  });

  it("refuses to terminate a foster that is not active", async () => {
    const { adminId, applicantId, animalId } = await setup();
    const { fosterApplicationId } = await submitFoster.invoke({
      animalId,
      applicantId: applicantId.toHexString(),
      answers: validAnswers,
    });

    // Still PENDING (not approved) — nothing to terminate.
    await expect(
      terminateFoster.invoke({
        fosterApplicationId,
        terminatedBy: adminId.toHexString(),
        reason: FosterEndReason.EARLY_TERMINATED,
      }),
    ).rejects.toThrow("진행 중인");
  });
});
