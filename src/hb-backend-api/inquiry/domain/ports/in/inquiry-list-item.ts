import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";

export interface InquiryLastMessage {
  body: string;
  senderRole: MessageSenderRole;
  sentAt: Date | null;
}

/**
 * An inquiry enriched for an inbox row: the thread plus the counterpart's
 * display name, the animal it's about, and the last message preview.
 */
export interface InquiryListItem {
  inquiry: Inquiry;
  /** The animal the inquiry is about (name), if resolvable. */
  animalName: string | null;
  /**
   * The other side's display name — the shelter's name in "내 문의", the
   * inquirer's nickname in the shelter inbox.
   */
  counterpartName: string | null;
  lastMessage: InquiryLastMessage | null;
}
