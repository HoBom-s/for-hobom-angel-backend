export interface SetAnimalBlindCommand {
  animalId: string;
  actorId: string;
  blinded: boolean;
}

/** Operator moderation: hides (blind) or reveals (unblind) an animal listing. */
export interface SetAnimalBlindUseCase {
  invoke(command: SetAnimalBlindCommand): Promise<void>;
}
