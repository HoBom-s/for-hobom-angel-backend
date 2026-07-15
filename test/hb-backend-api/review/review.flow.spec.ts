import { INestApplication } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { Model, Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { PlacementType } from "src/hb-backend-api/review/domain/enums/placement-type.enum";
import { ReviewEntity } from "src/hb-backend-api/review/domain/model/review.entity";
import {
  PlacementEligibilityPort,
  PlacementRecord,
} from "src/hb-backend-api/review/domain/ports/out/placement-eligibility.port";
import { ReviewQueryPort } from "src/hb-backend-api/review/domain/ports/out/review-query.port";
import { SubmitReviewUseCase } from "src/hb-backend-api/review/domain/ports/in/submit-review.use-case";
import { ReviseReviewUseCase } from "src/hb-backend-api/review/domain/ports/in/revise-review.use-case";
import { DeleteReviewUseCase } from "src/hb-backend-api/review/domain/ports/in/delete-review.use-case";

/** Fake 본인확인-equivalent for placements: refs are configured per test. */
class FakePlacementEligibility implements PlacementEligibilityPort {
  private readonly records = new Map<string, PlacementRecord>();
  public set(ref: string, record: PlacementRecord): void {
    this.records.set(ref, record);
  }
  public find(
    _type: PlacementType,
    ref: string,
  ): Promise<PlacementRecord | null> {
    return Promise.resolve(this.records.get(ref) ?? null);
  }
}

describe("Review (flow)", () => {
  let app: INestApplication;
  let mongo: MongoMemoryReplSet;
  const eligibility = new FakePlacementEligibility();
  let submit: SubmitReviewUseCase;
  let revise: ReviseReviewUseCase;
  let remove: DeleteReviewUseCase;
  let reviewQuery: ReviewQueryPort;
  let reviewModel: Model<ReviewEntity>;

  const shelter = new Types.ObjectId().toHexString();
  const author = new Types.ObjectId().toHexString();
  const ref = () => new Types.ObjectId().toHexString();
  const completed = (over: Partial<PlacementRecord> = {}): PlacementRecord => ({
    shelterId: shelter,
    adopterId: author,
    completed: true,
    ...over,
  });

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
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DIToken.ReviewModule.PlacementEligibilityPort)
      .useValue(eligibility)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    submit = app.get(DIToken.ReviewModule.SubmitReviewUseCase);
    revise = app.get(DIToken.ReviewModule.ReviseReviewUseCase);
    remove = app.get(DIToken.ReviewModule.DeleteReviewUseCase);
    reviewQuery = app.get(DIToken.ReviewModule.ReviewQueryPort);
    reviewModel = app.get(getModelToken(ReviewEntity.name));
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const write = (placementRef: string, rating = 5) =>
    submit.invoke({
      shelterId: shelter,
      authorId: author,
      placementType: PlacementType.ADOPTION,
      placementRef,
      rating,
      body: "정성껏 돌봐주셨어요.",
    });

  it("writes a review for a completed placement and rolls it into reputation", async () => {
    const placementRef = ref();
    eligibility.set(placementRef, completed());

    const { reviewId } = await write(placementRef, 4);
    expect(reviewId).toBeDefined();

    const reputation = await reviewQuery.reputationOf(
      ShelterId.fromString(shelter),
    );
    expect(reputation.reviewCount).toBe(1);
    expect(reputation.average).toBe(4);
    expect(reputation.distribution[4]).toBe(1);
  });

  it("rejects a second review for the same placement", async () => {
    const placementRef = ref();
    eligibility.set(placementRef, completed());
    await write(placementRef);

    await expect(write(placementRef)).rejects.toThrow("이미 후기");
  });

  it("refuses a placement owned by someone else", async () => {
    const placementRef = ref();
    eligibility.set(
      placementRef,
      completed({ adopterId: new Types.ObjectId().toHexString() }),
    );
    await expect(write(placementRef)).rejects.toThrow("본인");
  });

  it("refuses a placement at a different shelter", async () => {
    const placementRef = ref();
    eligibility.set(
      placementRef,
      completed({ shelterId: new Types.ObjectId().toHexString() }),
    );
    await expect(write(placementRef)).rejects.toThrow("보호소가 일치");
  });

  it("refuses an incomplete placement", async () => {
    const placementRef = ref();
    eligibility.set(placementRef, completed({ completed: false }));
    await expect(write(placementRef)).rejects.toThrow("완료된");
  });

  it("lets the author revise but blocks a stranger", async () => {
    const placementRef = ref();
    eligibility.set(placementRef, completed());
    const { reviewId } = await write(placementRef, 5);

    await revise.invoke({
      reviewId,
      editorId: author,
      rating: 2,
      body: "생각이 바뀌었어요.",
    });
    const doc = await reviewModel.findById(reviewId).lean().exec();
    expect(doc?.rating).toBe(2);
    expect(doc?.version).toBe(1);

    await expect(
      revise.invoke({
        reviewId,
        editorId: new Types.ObjectId().toHexString(),
        rating: 5,
        body: "남의 후기",
      }),
    ).rejects.toThrow("본인");
  });

  it("deletes the author's review and reputation drops it", async () => {
    const placementRef = ref();
    eligibility.set(placementRef, completed());
    const { reviewId } = await write(placementRef, 3);

    await remove.invoke({ reviewId, requesterId: author });

    const doc = await reviewModel.findById(reviewId).lean().exec();
    expect(doc).toBeNull();
  });
});
