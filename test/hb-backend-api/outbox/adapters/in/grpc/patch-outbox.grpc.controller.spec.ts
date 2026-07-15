import {
  MarkOutboxFailedUseCase,
  MarkOutboxSentUseCase,
} from "src/hb-backend-api/outbox/domain/ports/in/mark-outbox.use-case";
import { PatchOutboxGrpcController } from "src/hb-backend-api/outbox/adapters/in/grpc/patch-outbox.grpc.controller";

describe("PatchOutboxGrpcController", () => {
  let markSent: jest.Mocked<MarkOutboxSentUseCase>;
  let markFailed: jest.Mocked<MarkOutboxFailedUseCase>;
  let controller: PatchOutboxGrpcController;

  beforeEach(() => {
    markSent = { invoke: jest.fn().mockResolvedValue(true) };
    markFailed = { invoke: jest.fn().mockResolvedValue(true) };
    controller = new PatchOutboxGrpcController(markSent, markFailed);
  });

  it("marks a row sent and returns Empty", async () => {
    const res = await controller.markSent({ eventId: "e1" });
    expect(markSent.invoke).toHaveBeenCalledWith("e1");
    expect(res).toEqual({});
  });

  it("marks a row failed with its error and returns Empty", async () => {
    const res = await controller.markFailed({
      eventId: "e1",
      errorMessage: "boom",
    });
    expect(markFailed.invoke).toHaveBeenCalledWith("e1", "boom");
    expect(res).toEqual({});
  });
});
