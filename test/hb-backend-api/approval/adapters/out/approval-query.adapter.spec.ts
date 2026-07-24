import { Types } from "mongoose";
import { ApprovalStatus } from "src/hb-backend-api/approval/domain/enums/approval-status.enum";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequestEntity } from "src/hb-backend-api/approval/domain/model/approval-request.entity";
import { ApprovalRepository } from "src/hb-backend-api/approval/domain/repositories/approval.repository";
import { ApprovalQueryAdapter } from "src/hb-backend-api/approval/adapters/out/approval-query.adapter";

const doc = (id: Types.ObjectId): ApprovalRequestEntity =>
  ({
    _id: id,
    type: ApprovalType.STAFF_PROMOTION,
    subjectRef: new Types.ObjectId().toHexString(),
    requesterId: new Types.ObjectId().toHexString(),
    context: { shelterId: "s1" },
    status: ApprovalStatus.PENDING,
    version: 0,
    createdAt: new Date(),
  }) as unknown as ApprovalRequestEntity;

const build = (over: Partial<jest.Mocked<ApprovalRepository>> = {}) => {
  const repository = {
    findPendingPage: jest.fn(),
    countPendingByType: jest.fn(),
    ...over,
  } as unknown as jest.Mocked<ApprovalRepository>;
  return { repository, adapter: new ApprovalQueryAdapter(repository) };
};

describe("ApprovalQueryAdapter — operator pending queue", () => {
  it("keyset-pages: hasNext + nextCursor when the repo returns limit + 1", async () => {
    const ids = [
      new Types.ObjectId(),
      new Types.ObjectId(),
      new Types.ObjectId(),
    ];
    const { adapter } = build({
      findPendingPage: jest.fn().mockResolvedValue(ids.map(doc)),
    });

    const page = await adapter.findPending(null, null, 2);

    expect(page.items).toHaveLength(2);
    expect(page.hasNext).toBe(true);
    expect(page.nextCursor).toBe(ids[1].toHexString());
  });

  it("passes a valid cursor as ObjectId and rejects a bad one as null", async () => {
    const findPendingPage = jest.fn().mockResolvedValue([]);
    const { adapter } = build({ findPendingPage });
    const cursor = new Types.ObjectId().toHexString();

    await adapter.findPending(ApprovalType.ADOPTION, cursor, 20);
    expect(findPendingPage).toHaveBeenLastCalledWith(
      ApprovalType.ADOPTION,
      expect.any(Types.ObjectId),
      20,
    );

    await adapter.findPending(null, "bad", 20);
    expect(findPendingPage).toHaveBeenLastCalledWith(null, null, 20);
  });

  it("counts every type, defaulting the absent ones to 0", async () => {
    const { adapter } = build({
      countPendingByType: jest.fn().mockResolvedValue([
        { type: ApprovalType.STAFF_PROMOTION, count: 3 },
        { type: ApprovalType.FOSTER, count: 1 },
      ]),
    });

    const counts = await adapter.countPendingByType();

    expect(counts).toEqual({
      [ApprovalType.SHELTER_VERIFICATION]: 0,
      [ApprovalType.STAFF_PROMOTION]: 3,
      [ApprovalType.ADOPTION]: 0,
      [ApprovalType.FOSTER]: 1,
    });
  });
});
