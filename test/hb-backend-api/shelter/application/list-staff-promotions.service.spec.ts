import { ForbiddenException } from "@nestjs/common";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerActivityPort } from "src/hb-backend-api/shelter/domain/ports/out/volunteer-activity.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { ListStaffPromotionsService } from "src/hb-backend-api/shelter/application/use-cases/list-staff-promotions.service";

const shelterId = ShelterId.generate();
const actorId = UserId.generate().toString();
const candidateId = UserId.generate().toString();
const joinedAt = new Date("2025-11-01T00:00:00.000Z");

const staff = (canManage: boolean) =>
  ({ canManageShelter: jest.fn().mockReturnValue(canManage) }) as never;

const candidate = () =>
  ({ getNickname: { raw: "nari" }, getCreatedAt: joinedAt }) as never;

const pendingRequest = (subjectRef: string, id: string) =>
  ({ getSubjectRef: subjectRef, getId: { toString: () => id } }) as never;

const build = (over: {
  canManage?: boolean;
  actorExists?: boolean;
  requests?: unknown[];
  candidateResolves?: boolean;
}) => {
  const users: Record<string, unknown> = {
    [actorId]:
      over.actorExists === false ? null : staff(over.canManage ?? true),
    [candidateId]: over.candidateResolves === false ? null : candidate(),
  };
  const approvalQueryPort = {
    findById: jest.fn(),
    findPendingByTypeAndShelter: jest
      .fn()
      .mockResolvedValue(
        over.requests ?? [pendingRequest(candidateId, "appr-1")],
      ),
  } as unknown as jest.Mocked<ApprovalQueryPort>;
  const userQueryPort = {
    findById: jest
      .fn()
      .mockImplementation((uid: UserId) =>
        Promise.resolve(users[uid.toString()] ?? null),
      ),
  } as unknown as jest.Mocked<UserQueryPort>;
  const volunteerActivityPort = {
    countApprovedByVolunteer: jest.fn().mockResolvedValue(20),
  } as unknown as jest.Mocked<VolunteerActivityPort>;
  return {
    approvalQueryPort,
    userQueryPort,
    volunteerActivityPort,
    service: new ListStaffPromotionsService(
      approvalQueryPort,
      userQueryPort,
      volunteerActivityPort,
    ),
  };
};

const query = { shelterId: shelterId.toString(), actorId };

describe("ListStaffPromotionsService", () => {
  it("forbids a caller who cannot manage the shelter", async () => {
    const { service } = build({ canManage: false });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("forbids when the caller does not exist", async () => {
    const { service } = build({ actorExists: false });
    await expect(service.invoke(query)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("returns enriched pending promotions and queries the right slice", async () => {
    const { service, approvalQueryPort } = build({});

    const result = await service.invoke(query);

    expect(approvalQueryPort.findPendingByTypeAndShelter).toHaveBeenCalledWith(
      ApprovalType.STAFF_PROMOTION,
      shelterId.toString(),
      100,
    );
    expect(result).toEqual([
      {
        approvalId: "appr-1",
        candidateUserId: candidateId,
        candidateNickname: "nari",
        candidateJoinedAt: joinedAt,
        volunteerCount: 20,
      },
    ]);
  });

  it("drops a request whose candidate no longer resolves", async () => {
    const { service, volunteerActivityPort } = build({
      candidateResolves: false,
    });

    const result = await service.invoke(query);

    expect(result).toEqual([]);
    expect(
      volunteerActivityPort.countApprovedByVolunteer,
    ).not.toHaveBeenCalled();
  });
});
