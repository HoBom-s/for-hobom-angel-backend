import { ConsentView } from "src/hb-backend-api/consent/domain/model/consent-view";

/** The caller's consent state per policy type, with re-consent flags. */
export interface ListMyConsentsUseCase {
  invoke(userId: string): Promise<ConsentView[]>;
}
