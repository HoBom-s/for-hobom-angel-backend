import { Page } from "src/shared/pagination/page";
import { InquiryListItem } from "src/hb-backend-api/inquiry/domain/ports/in/inquiry-list-item";

export interface ListShelterInquiriesQuery {
  shelterId: string;
  /** The staff member reading the shelter's inbox (must manage the shelter). */
  actorId: string;
  cursor?: string;
  limit: number;
}

/** A shelter's inquiry inbox, newest first, cursor-paged, inbox-enriched. Staff-only. */
export interface ListShelterInquiriesUseCase {
  invoke(query: ListShelterInquiriesQuery): Promise<Page<InquiryListItem>>;
}
