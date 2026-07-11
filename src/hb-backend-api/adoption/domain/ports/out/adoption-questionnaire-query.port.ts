import { AdoptionQuestionnaire } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

/** Read-side port for adoption questionnaires. */
export interface AdoptionQuestionnaireQueryPort {
  findByShelter(shelterId: ShelterId): Promise<AdoptionQuestionnaire | null>;
}
