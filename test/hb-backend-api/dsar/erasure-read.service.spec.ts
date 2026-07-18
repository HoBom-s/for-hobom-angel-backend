import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { ErasureRequestStatus } from "src/shared/erasure/erasure-request-status.enum";
import { ErasureTaskStatus } from "src/shared/erasure/erasure-task-status.enum";
import { GetErasureRequestService } from "src/hb-backend-api/dsar/application/use-cases/get-erasure-request.service";
import { ListSubjectErasuresService } from "src/hb-backend-api/dsar/application/use-cases/list-subject-erasures.service";

const actorId = new Types.ObjectId().toString();
const admin = { isPlatformAdmin: () => true };
const member = { isPlatformAdmin: () => false };

const fakeRequest = () => ({
  _id: new Types.ObjectId(),
  subjectId: new Types.ObjectId(),
  status: ErasureRequestStatus.COMPLETED,
  tasks: [
    {
      key: "user.identity",
      category: "IDENTITY",
      disposition: "ANONYMIZE",
      status: ErasureTaskStatus.DONE,
      affected: 1,
      retained: 0,
      attempts: 1,
    },
  ],
  completedAt: new Date(0),
  createdAt: new Date(0),
});

describe("Erasure read services", () => {
  const userQueryPort = (actor: unknown) => ({
    findById: jest.fn().mockResolvedValue(actor),
  });

  describe("GetErasureRequestService", () => {
    const build = (actor: unknown, request: unknown) => {
      const engine = { getRequest: jest.fn().mockResolvedValue(request) };
      return new GetErasureRequestService(
        userQueryPort(actor) as never,
        engine as never,
      );
    };

    it("rejects a non-operator", async () => {
      await expect(
        build(member, fakeRequest()).invoke({
          actorId,
          requestId: new Types.ObjectId().toString(),
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("404s an unknown request", async () => {
      await expect(
        build(admin, null).invoke({
          actorId,
          requestId: new Types.ObjectId().toString(),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("maps the request to a report view", async () => {
      const view = await build(admin, fakeRequest()).invoke({
        actorId,
        requestId: new Types.ObjectId().toString(),
      });
      expect(view.status).toBe(ErasureRequestStatus.COMPLETED);
      expect(view.totalAffected).toBe(1);
      expect(view.tasks).toHaveLength(1);
    });
  });

  describe("ListSubjectErasuresService", () => {
    const build = (actor: unknown, requests: unknown[]) => {
      const engine = {
        getRequestsBySubject: jest.fn().mockResolvedValue(requests),
      };
      return new ListSubjectErasuresService(
        userQueryPort(actor) as never,
        engine as never,
      );
    };

    it("rejects a non-operator", async () => {
      await expect(
        build(member, []).invoke({
          actorId,
          subjectId: new Types.ObjectId().toString(),
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("lists a subject's erasure reports", async () => {
      const views = await build(admin, [fakeRequest(), fakeRequest()]).invoke({
        actorId,
        subjectId: new Types.ObjectId().toString(),
      });
      expect(views).toHaveLength(2);
      expect(views[0].totalAffected).toBe(1);
    });
  });
});
