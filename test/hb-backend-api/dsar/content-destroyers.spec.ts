import { Types } from "mongoose";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Destroyer } from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { ERASED_TEXT } from "src/shared/erasure/tombstone";
import { ErasureContext } from "src/shared/erasure/erasure-context";
import { AdoptionApplicationDestroyer } from "src/hb-backend-api/adoption/adapters/erasure/adoption-application.destroyer";
import { FosterApplicationDestroyer } from "src/hb-backend-api/foster/adapters/erasure/foster-application.destroyer";
import { MessageDestroyer } from "src/hb-backend-api/messaging/adapters/erasure/message.destroyer";
import { ReviewDestroyer } from "src/hb-backend-api/review/adapters/erasure/review.destroyer";
import { VolunteerPostDestroyer } from "src/hb-backend-api/volunteer-post/adapters/erasure/volunteer-post.destroyer";
import { VolunteerPostCommentDestroyer } from "src/hb-backend-api/volunteer-post/adapters/erasure/volunteer-post-comment.destroyer";
import { ReportDestroyer } from "src/hb-backend-api/report/adapters/erasure/report.destroyer";

const ctx = ErasureContext.of("actor", null);
const subjectId = new Types.ObjectId().toString();

const mockModel = () => ({
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 3 }),
  countDocuments: jest.fn().mockReturnValue({ exec: () => Promise.resolve(0) }),
});

interface Case {
  name: string;
  make: (model: ReturnType<typeof mockModel>) => Destroyer;
  fk: string;
  set: Record<string, unknown>;
}

const cases: Case[] = [
  {
    name: "AdoptionApplicationDestroyer",
    make: (m) => new AdoptionApplicationDestroyer(m as never),
    fk: "applicantId",
    set: { answers: [] },
  },
  {
    name: "FosterApplicationDestroyer",
    make: (m) => new FosterApplicationDestroyer(m as never),
    fk: "applicantId",
    set: { answers: [] },
  },
  {
    name: "MessageDestroyer",
    make: (m) => new MessageDestroyer(m as never),
    fk: "senderId",
    set: { body: ERASED_TEXT },
  },
  {
    name: "ReviewDestroyer",
    make: (m) => new ReviewDestroyer(m as never),
    fk: "authorId",
    set: { body: ERASED_TEXT },
  },
  {
    name: "VolunteerPostDestroyer",
    make: (m) => new VolunteerPostDestroyer(m as never),
    fk: "authorId",
    set: { content: [] },
  },
  {
    name: "VolunteerPostCommentDestroyer",
    make: (m) => new VolunteerPostCommentDestroyer(m as never),
    fk: "authorId",
    set: { body: ERASED_TEXT },
  },
  {
    name: "ReportDestroyer",
    make: (m) => new ReportDestroyer(m as never),
    fk: "reporterId",
    set: { detail: "" },
  },
];

describe("content destroyers", () => {
  it.each(cases)(
    "$name purges the authored free-text by FK and reports the count",
    async ({ make, fk, set }) => {
      const model = mockModel();
      const destroyer = make(model);

      const receipt = await destroyer.erase(subjectId, ctx);

      expect(receipt.disposition).toBe(Disposition.ANONYMIZE);
      expect(receipt.affected).toBe(3);
      const [filter, update] = model.updateMany.mock.calls[0];
      expect((filter as Record<string, unknown>)[fk]).toBeInstanceOf(
        Types.ObjectId,
      );
      expect(update).toEqual({ $set: set });
    },
  );

  it.each(cases)(
    "$name reports residual via countDocuments",
    async ({ make }) => {
      const model = mockModel();
      expect(await make(model).verifyResidual(subjectId)).toBe(0);
      expect(model.countDocuments).toHaveBeenCalledTimes(1);
    },
  );

  it("all use a content category (SOCIAL/MESSAGES/APPLICATIONS/MODERATION)", () => {
    const categories = cases.map((c) => c.make(mockModel()).rule.category);
    for (const category of categories) {
      expect(
        [
          DataCategory.APPLICATIONS,
          DataCategory.MESSAGES,
          DataCategory.SOCIAL,
          DataCategory.MODERATION,
        ].includes(category),
      ).toBe(true);
    }
  });
});
