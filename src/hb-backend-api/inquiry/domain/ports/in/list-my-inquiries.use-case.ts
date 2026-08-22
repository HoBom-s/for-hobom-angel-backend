import { Page } from "src/shared/pagination/page";
import { InquiryListItem } from "src/hb-backend-api/inquiry/domain/ports/in/inquiry-list-item";

export interface ListMyInquiriesQuery {
  inquirerId: string;
  cursor?: string;
  limit: number;
}

/** A member's own inquiry threads, newest first, cursor-paged, inbox-enriched. */
export interface ListMyInquiriesUseCase {
  invoke(query: ListMyInquiriesQuery): Promise<Page<InquiryListItem>>;
}
