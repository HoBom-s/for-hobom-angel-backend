import { AdopterHistory } from "src/hb-backend-api/adopter-history/domain/model/adopter-history";

export interface GetAdopterHistoryQuery {
  userId: string;
  viewerId: string;
}

/** A shelter operator looks up an applicant's placement/return history. */
export interface GetAdopterHistoryUseCase {
  invoke(query: GetAdopterHistoryQuery): Promise<AdopterHistory>;
}
