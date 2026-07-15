export interface RelistAnimalCommand {
  animalId: string;
  actorId: string;
}

/** Re-opens a RETURNED animal for adoption again (-> AVAILABLE). */
export interface RelistAnimalUseCase {
  invoke(command: RelistAnimalCommand): Promise<void>;
}
