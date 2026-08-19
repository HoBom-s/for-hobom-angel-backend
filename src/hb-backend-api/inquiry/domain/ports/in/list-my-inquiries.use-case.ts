import { Page } from "src/shared/pagination/page";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";

export interface ListMyInquiriesQuery {
  inquirerId: string;
  cursor?: string;
  limit: number;
}

/** A member's own inquiry threads, newest first, cursor-paged. */
export interface ListMyInquiriesUseCase {
  invoke(query: ListMyInquiriesQuery): Promise<Page<Inquiry>>;
}
