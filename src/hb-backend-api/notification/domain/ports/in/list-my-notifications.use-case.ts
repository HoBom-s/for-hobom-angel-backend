import { Page } from "src/shared/pagination/page";
import { Notification } from "src/hb-backend-api/notification/domain/model/notification";

export interface ListMyNotificationsQuery {
  recipientId: string;
  cursor?: string;
  limit: number;
}

/** A recipient's notification feed, newest first, cursor-paged. */
export interface ListMyNotificationsUseCase {
  invoke(query: ListMyNotificationsQuery): Promise<Page<Notification>>;
}
