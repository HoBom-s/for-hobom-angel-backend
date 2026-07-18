import { ErasureRequestView } from "src/hb-backend-api/dsar/domain/model/erasure-request-view";

export interface GetErasureRequestCommand {
  actorId: string;
  requestId: string;
}

/** Reads an erasure request's progress / final report (operator only). */
export interface GetErasureRequestUseCase {
  invoke(command: GetErasureRequestCommand): Promise<ErasureRequestView>;
}
