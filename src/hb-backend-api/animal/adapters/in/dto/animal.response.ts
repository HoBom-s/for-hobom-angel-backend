import { ApiProperty } from "@nestjs/swagger";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";

/** Public animal view for listing and detail. */
export class AnimalResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  shelterId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AnimalSpecies })
  species: AnimalSpecies;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: AnimalStatus })
  status: AnimalStatus;

  @ApiProperty({ type: Object })
  traits: Record<string, unknown>;

  @ApiProperty({ type: Object })
  health: Record<string, unknown>;

  @ApiProperty({ type: Object })
  intake: Record<string, unknown>;

  @ApiProperty({ type: [Object] })
  photos: { objectKey: string; caption?: string }[];

  public static from(animal: Animal): AnimalResponse {
    const traits = animal.getTraits;
    const health = animal.getHealth;
    const intake = animal.getIntake;

    const dto = new AnimalResponse();
    dto.id = animal.getId.toString();
    dto.shelterId = animal.getShelterId.toString();
    dto.name = animal.getName;
    dto.species = animal.getSpecies;
    dto.description = animal.getDescription;
    dto.status = animal.getStatus;
    dto.traits = {
      sex: traits.getSex,
      size: traits.getSize,
      ageMonths: traits.getAgeMonths,
      breed: traits.getBreed,
      color: traits.getColor,
      personality: traits.getPersonality,
    };
    dto.health = {
      neutered: health.isNeutered,
      vaccinated: health.isVaccinated,
      microchipId: health.getMicrochipId,
      notes: health.getNotes,
    };
    dto.intake = {
      intakeDate: intake.getIntakeDate,
      rescueStory: intake.getRescueStory,
      noticeNumber: intake.getNoticeNumber,
    };
    dto.photos = animal.getPhotos.map((p) => p.toPlain());
    return dto;
  }
}
