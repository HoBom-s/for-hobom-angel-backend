import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";

/** Factory VO for a new outbox row (pre-persistence). */
export class CreateOutboxEntity {
  private constructor(
    public readonly eventType: EventType,
    public readonly payload: Record<string, unknown>,
    public readonly status: OutboxStatus,
    public readonly retryCount: number,
    public readonly version: number,
  ) {}

  public static of(
    eventType: EventType,
    payload: Record<string, unknown>,
    status: OutboxStatus = OutboxStatus.PENDING,
    retryCount = 0,
    version = 1,
  ): CreateOutboxEntity {
    if (Object.keys(payload).length === 0) {
      throw new Error("Outbox 이벤트 payload가 비어 있어요.");
    }
    if (retryCount < 0) {
      throw new Error("retryCount는 음수일 수 없어요.");
    }
    if (version < 1) {
      throw new Error("version은 1 이상이어야 해요.");
    }
    return new CreateOutboxEntity(
      eventType,
      payload,
      status,
      retryCount,
      version,
    );
  }
}
