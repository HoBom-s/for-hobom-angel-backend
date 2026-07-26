import { ForbiddenException } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ListPendingApprovalsService } from "src/hb-backend-api/approval/application/use-cases/list-pending-approvals.service";
import { CountPendingApprovalsService } from "src/hb-backend-api/approval/application/use-cases/count-pending-approvals.service";

const viewerId = UserId.generate().toString();

const operator = (isAdmin: boolean) =>
  ({ isPlatformAdmin: () => isAdmin }) as never;

const emptyPage: Page<ApprovalRequest> = {
  items: [],
  nextCursor: null,
  hasNext: false,
};

const queryPort = () =>
  ({
    findPending: jest.fn().mockResolvedValue(emptyPage),
    countPendingByType: jest.fn().mockResolvedValue({
      [ApprovalType.SHELTER_VERIFICATION]: 1,
      [ApprovalType.STAFF_PROMOTION]: 2,
      [ApprovalType.ADOPTION]: 0,
      [ApprovalType.FOSTER]: 0,
    }),
  }) as unknown as jest.Mocked<ApprovalQueryPort>;

const userPort = (isAdmin: boolean, exists = true) =>
  ({
    findById: jest.fn().mockResolvedValue(exists ? operator(isAdmin) : null),
  }) as unknown as jest.Mocked<UserQueryPort>;

describe("ListPendingApprovalsService", () => {
  it("forbids a non-operator", async () => {
    const service = new ListPendingApprovalsService(
      queryPort(),
      userPort(false),
    );
    await expect(
      service.invoke({ viewerId, limit: 20 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("forbids when the viewer does not exist", async () => {
    const service = new ListPendingApprovalsService(
      queryPort(),
      userPort(false, false),
    );
    await expect(
      service.invoke({ viewerId, limit: 20 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("delegates to findPending with the type/cursor filters normalized", async () => {
    const approvals = queryPort();
    const service = new ListPendingApprovalsService(approvals, userPort(true));

    await service.invoke({
      viewerId,
      type: ApprovalType.ADOPTION,
      cursor: "c1",
      limit: 15,
    });
    expect(approvals.findPending).toHaveBeenCalledWith(
      ApprovalType.ADOPTION,
      "c1",
      15,
    );

    await service.invoke({ viewerId, limit: 20 });
    expect(approvals.findPending).toHaveBeenLastCalledWith(null, null, 20);
  });
});

describe("CountPendingApprovalsService", () => {
  it("forbids a non-operator", async () => {
    const service = new CountPendingApprovalsService(
      queryPort(),
      userPort(false),
    );
    await expect(service.invoke({ viewerId })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("returns per-type counts for an operator", async () => {
    const service = new CountPendingApprovalsService(
      queryPort(),
      userPort(true),
    );
    const counts = await service.invoke({ viewerId });
    expect(counts).toEqual({
      [ApprovalType.SHELTER_VERIFICATION]: 1,
      [ApprovalType.STAFF_PROMOTION]: 2,
      [ApprovalType.ADOPTION]: 0,
      [ApprovalType.FOSTER]: 0,
    });
  });
});
