import { Page } from "src/shared/pagination/page";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";

export interface ListShelterInquiriesQuery {
  shelterId: string;
  /** The staff member reading the shelter's inbox (must manage the shelter). */
  actorId: string;
  cursor?: string;
  limit: number;
}

/** A shelter's inquiry inbox, newest first, cursor-paged. Staff-only. */
export interface ListShelterInquiriesUseCase {
  invoke(query: ListShelterInquiriesQuery): Promise<Page<Inquiry>>;
}
