import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";

export interface TerminateFosterCommand {
  fosterApplicationId: string;
  /** The shelter staff/admin or the fosterer ending the care. */
  terminatedBy: string;
  reason: FosterEndReason;
}

/**
 * Ends an active foster (early termination or expiry): returns the animal to
 * AVAILABLE and emits the termination notification. Only the owning shelter's
 * staff/admin or the fosterer may end it.
 */
export interface TerminateFosterUseCase {
  invoke(command: TerminateFosterCommand): Promise<void>;
}
