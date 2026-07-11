import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";

/** Read-side port for adoption applications. */
export interface AdoptionApplicationQueryPort {
  findById(id: ApplicationId): Promise<AdoptionApplication | null>;
}
