import { Message } from "src/hb-backend-api/messaging/domain/model/message";

/** Write-side port for messages (append-only). */
export interface MessagePersistencePort {
  create(message: Message): Promise<void>;
}
