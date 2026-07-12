export interface ConvertFosterToAdoptionCommand {
  fosterApplicationId: string;
  actorId: string;
}

export interface ConvertFosterToAdoptionResult {
  adoptionId: string;
}

/**
 * Converts an active foster into an adoption: the fosterer keeps the animal for
 * good. Ends the foster, marks the animal ADOPTED, and records an APPROVED
 * adoption for the fosterer.
 */
export interface ConvertFosterToAdoptionUseCase {
  invoke(
    command: ConvertFosterToAdoptionCommand,
  ): Promise<ConvertFosterToAdoptionResult>;
}
