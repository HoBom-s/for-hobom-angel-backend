export interface ReturnAdoptionCommand {
  adoptionId: string;
  actorId: string;
  reason: string;
}

/**
 * Records that an adopted animal came back (파양/반환): the adoption becomes
 * RETURNED and the animal moves to RETURNED, awaiting re-listing.
 */
export interface ReturnAdoptionUseCase {
  invoke(command: ReturnAdoptionCommand): Promise<void>;
}
