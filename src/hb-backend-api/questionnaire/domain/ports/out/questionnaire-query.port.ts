import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { Questionnaire } from "src/hb-backend-api/questionnaire/domain/model/questionnaire";

/** Read-side port for questionnaires. */
export interface QuestionnaireQueryPort {
  findByShelterAndPurpose(
    shelterId: ShelterId,
    purpose: QuestionnairePurpose,
  ): Promise<Questionnaire | null>;
}
