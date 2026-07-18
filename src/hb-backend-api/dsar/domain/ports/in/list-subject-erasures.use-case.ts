import { ErasureRequestView } from "src/hb-backend-api/dsar/domain/model/erasure-request-view";

export interface ListSubjectErasuresCommand {
  actorId: string;
  subjectId: string;
}

/** Lists a subject's erasure requests / reports (operator only). */
export interface ListSubjectErasuresUseCase {
  invoke(command: ListSubjectErasuresCommand): Promise<ErasureRequestView[]>;
}
