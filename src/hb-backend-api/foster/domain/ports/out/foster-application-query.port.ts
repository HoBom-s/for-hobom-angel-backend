import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";

/** Read-side port for foster applications. */
export interface FosterApplicationQueryPort {
  findById(id: FosterApplicationId): Promise<FosterApplication | null>;
}
