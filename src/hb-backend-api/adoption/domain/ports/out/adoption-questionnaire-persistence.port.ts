import { AdoptionQuestionnaire } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire";

/** Write-side port for adoption questionnaires (one per shelter). */
export interface AdoptionQuestionnairePersistencePort {
  create(questionnaire: AdoptionQuestionnaire): Promise<void>;
  save(questionnaire: AdoptionQuestionnaire): Promise<void>;
}
