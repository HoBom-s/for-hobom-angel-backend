import { Page } from "src/shared/pagination/page";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

/** Lists verified shelters for the §04 directory (region filter + cursor page). */
export interface ListSheltersUseCase {
  invoke(params: {
    region?: string;
    keyword?: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<Shelter>>;
}
