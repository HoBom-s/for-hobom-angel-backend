import {
  AnimalHealthInput,
  AnimalTraitsInput,
} from "src/hb-backend-api/animal/domain/ports/in/register-animal.use-case";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";

export interface UpdateAnimalProfileCommand {
  animalId: string;
  /** The staff/admin member editing the profile. */
  editedBy: string;
  name: string;
  species: AnimalSpecies;
  description?: string;
  traits: AnimalTraitsInput;
  health: AnimalHealthInput;
}

/**
 * Edits an animal's display profile (name, species, description, traits,
 * health). Only staff/admin of the owning shelter may edit; the intake record
 * and adoption status are not touched here.
 */
export interface UpdateAnimalProfileUseCase {
  invoke(command: UpdateAnimalProfileCommand): Promise<void>;
}
