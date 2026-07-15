import { RpcException } from "@nestjs/microservices";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { FindOutboxUseCase } from "src/hb-backend-api/outbox/domain/ports/in/find-outbox.use-case";
import { OutboxView } from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";
import { FindOutboxGrpcController } from "src/hb-backend-api/outbox/adapters/in/grpc/find-outbox.grpc.controller";

describe("FindOutboxGrpcController", () => {
  let useCase: jest.Mocked<FindOutboxUseCase>;
  let controller: FindOutboxGrpcController;

  beforeEach(() => {
    useCase = { invoke: jest.fn() };
    controller = new FindOutboxGrpcController(useCase);
  });

  it("parses enums, delegates, and maps rows to the wire shape", async () => {
    const view: OutboxView = {
      id: "row-1",
      eventId: "evt-1",
      eventType: EventType.ADOPTION_APPROVED,
      payload: { subjectRef: "s", recipientUserId: "u" },
      status: OutboxStatus.PENDING,
      retryCount: 0,
      sentAt: null,
      failedAt: null,
      lastError: null,
      version: 1,
      createdAt: new Date("2026-07-15T00:00:00.000Z"),
      updatedAt: new Date("2026-07-15T00:00:00.000Z"),
    };
    useCase.invoke.mockResolvedValue([view]);

    const res = await controller.find({
      eventType: "ADOPTION_APPROVED",
      status: "PENDING",
    });

    expect(useCase.invoke).toHaveBeenCalledWith(
      EventType.ADOPTION_APPROVED,
      OutboxStatus.PENDING,
    );
    expect(res.items).toHaveLength(1);
    expect(res.items[0].eventId).toBe("evt-1");
  });

  it("rejects an unknown status before calling the use-case", async () => {
    await expect(
      controller.find({ eventType: "ADOPTION_APPROVED", status: "X" }),
    ).rejects.toThrow(RpcException);
    expect(useCase.invoke).not.toHaveBeenCalled();
  });
});
