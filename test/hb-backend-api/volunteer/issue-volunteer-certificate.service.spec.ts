import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";
import { IssueVolunteerCertificateService } from "src/hb-backend-api/volunteer/application/use-cases/issue-volunteer-certificate.service";

const userId = new Types.ObjectId().toString();
const SHELTER_ID = new Types.ObjectId().toString();

const event = (over: {
  id?: string;
  shelterId?: string;
  endAt: Date;
  startAt?: Date;
  status?: VolunteerEventStatus;
}) => ({
  getId: { toString: () => over.id ?? "e1" },
  getShelterId: { toString: () => over.shelterId ?? SHELTER_ID },
  getTitle: "산책 봉사",
  getStartAt: over.startAt ?? new Date("2026-06-01T01:00:00Z"),
  getEndAt: over.endAt,
  getStatus: over.status ?? VolunteerEventStatus.CLOSED,
});

describe("IssueVolunteerCertificateService", () => {
  const build = (over: { user?: unknown; events?: unknown[] } = {}) => {
    const userQueryPort = {
      findById: jest
        .fn()
        .mockResolvedValue(
          over.user === undefined
            ? { getNickname: { raw: "hong" } }
            : over.user,
        ),
    };
    const signupQueryPort = {
      findApprovedByVolunteer: jest
        .fn()
        .mockResolvedValue([{ getEventId: "e1" }]),
    };
    const eventQueryPort = {
      findByIds: jest.fn().mockResolvedValue(over.events ?? []),
    };
    const shelterQueryPort = {
      findById: jest.fn().mockResolvedValue({ getName: "행복 보호소" }),
    };
    const persistencePort = {
      save: jest.fn((c: VolunteerCertificate) => Promise.resolve(c)),
    };
    const service = new IssueVolunteerCertificateService(
      userQueryPort as never,
      signupQueryPort as never,
      eventQueryPort as never,
      shelterQueryPort as never,
      persistencePort,
    );
    return { service, persistencePort, shelterQueryPort };
  };

  it("404 when the user is missing", async () => {
    const { service } = build({ user: null });
    await expect(service.invoke(userId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("rejects issuing when there is no completed participation", async () => {
    const future = event({ endAt: new Date(Date.now() + 86_400_000) });
    const { service } = build({ events: [future] });
    await expect(service.invoke(userId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("includes only ended, non-cancelled events and computes minutes", async () => {
    const ended = event({
      id: "e1",
      startAt: new Date("2026-06-01T01:00:00Z"),
      endAt: new Date("2026-06-01T04:00:00Z"), // 180 min, past
    });
    const cancelled = event({
      id: "e2",
      endAt: new Date("2026-06-02T04:00:00Z"),
      status: VolunteerEventStatus.CANCELLED,
    });
    const future = event({
      id: "e3",
      endAt: new Date(Date.now() + 86_400_000),
    });
    const { service, persistencePort } = build({
      events: [ended, cancelled, future],
    });

    const cert = await service.invoke(userId);

    expect(persistencePort.save).toHaveBeenCalledTimes(1);
    expect(cert.getTotalCount).toBe(1); // only the ended, non-cancelled one
    expect(cert.getTotalMinutes).toBe(180);
    expect(cert.getItems[0].shelterName).toBe("행복 보호소");
  });
});
