import { Questionnaire } from "src/hb-backend-api/questionnaire/domain/model/questionnaire";

/** Write-side port for questionnaires (one per shelter and purpose). */
export interface QuestionnairePersistencePort {
  create(questionnaire: Questionnaire): Promise<void>;
  save(questionnaire: Questionnaire): Promise<void>;
}
