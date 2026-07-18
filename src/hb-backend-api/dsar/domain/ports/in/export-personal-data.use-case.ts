import { PersonalData } from "src/hb-backend-api/user/domain/model/personal-data";

export interface ExportPersonalDataCommand {
  actorId: string;
  subjectId: string;
  reason?: string | null;
}

/** DSAR access: an operator exports a subject's identity/profile PII (audited). */
export interface ExportPersonalDataUseCase {
  invoke(command: ExportPersonalDataCommand): Promise<PersonalData>;
}
