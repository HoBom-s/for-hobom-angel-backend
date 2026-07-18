import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";

export interface AnimalTraitsInput {
  sex: AnimalSex;
  size: AnimalSize;
  ageMonths?: number;
  breed?: string;
  color?: string;
  personality?: string;
  weightKg?: number;
}

export interface AnimalHealthInput {
  neutered: boolean;
  vaccinated: boolean;
  microchipId?: string;
  notes?: string;
}

export interface AnimalIntakeInput {
  intakeDate: Date;
  rescueStory?: string;
  noticeNumber?: string;
}

export interface AnimalPhotoInput {
  objectKey: string;
  caption?: string;
}

export interface RegisterAnimalCommand {
  shelterId: string;
  /** The staff/admin member registering the animal. */
  registeredBy: string;
  name: string;
  species: AnimalSpecies;
  description?: string;
  traits: AnimalTraitsInput;
  health: AnimalHealthInput;
  intake: AnimalIntakeInput;
  photos?: AnimalPhotoInput[];
}

export interface RegisterAnimalResult {
  animalId: string;
}

/**
 * Lists a new animal under a shelter. Only a verified shelter's staff/admin may
 * register; the animal starts AVAILABLE.
 */
export interface RegisterAnimalUseCase {
  invoke(command: RegisterAnimalCommand): Promise<RegisterAnimalResult>;
}
