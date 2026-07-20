import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
import { AdoptionApplicationRepository } from "src/hb-backend-api/adoption/domain/repositories/adoption-application.repository";
import { AdoptionApplicationQueryAdapter } from "src/hb-backend-api/adoption/adapters/out/adoption-application-query.adapter";

const doc = (id: Types.ObjectId): AdoptionApplicationEntity =>
  ({
    _id: id,
    animalId: new Types.ObjectId(),
    shelterId: new Types.ObjectId(),
    applicantId: new Types.ObjectId(),
    questionnaireVersion: 1,
    answers: [],
    status: AdoptionApplicationStatus.PENDING,
    version: 0,
    createdAt: new Date(),
  }) as unknown as AdoptionApplicationEntity;

describe("AdoptionApplicationQueryAdapter — keyset pagination", () => {
  const build = (docs: AdoptionApplicationEntity[]) => {
    const repository = {
      findPageByShelter: jest.fn().mockResolvedValue(docs),
      findPageByApplicant: jest.fn().mockResolvedValue(docs),
    } as unknown as jest.Mocked<AdoptionApplicationRepository>;
    return {
      repository,
      adapter: new AdoptionApplicationQueryAdapter(repository),
    };
  };

  it("sets hasNext and nextCursor when the repo returns limit + 1", async () => {
    const ids = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];
    const { adapter } = build(ids.map(doc)); // limit 2 → 3 rows

    const page = await adapter.findPageByShelter(
      ShelterId.generate(),
      null,
      null,
      2,
    );

    expect(page.items).toHaveLength(2);
    expect(page.hasNext).toBe(true);
    // cursor is the last KEPT row (the 2nd), not the overflow row.
    expect(page.nextCursor).toBe(ids[1].toHexString());
  });

  it("has no next page when the repo returns at or under the limit", async () => {
    const { adapter } = build([doc(new Types.ObjectId())]);

    const page = await adapter.findPageByApplicant(
      UserId.generate(),
      null,
      null,
      2,
    );

    expect(page.items).toHaveLength(1);
    expect(page.hasNext).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it("parses a valid cursor into an ObjectId and drops an invalid one", async () => {
    const { adapter, repository } = build([]);
    const cursor = new Types.ObjectId().toHexString();

    await adapter.findPageByShelter(ShelterId.generate(), null, cursor, 20);
    expect(repository.findPageByShelter).toHaveBeenLastCalledWith(
      expect.any(Types.ObjectId),
      null,
      expect.any(Types.ObjectId),
      20,
    );

    await adapter.findPageByShelter(
      ShelterId.generate(),
      null,
      "not-an-id",
      20,
    );
    expect(repository.findPageByShelter).toHaveBeenLastCalledWith(
      expect.any(Types.ObjectId),
      null,
      null,
      20,
    );
  });
});
