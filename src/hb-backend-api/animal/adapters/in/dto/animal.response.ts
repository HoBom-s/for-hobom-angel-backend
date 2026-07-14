import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { Shelter } from "src/hb-backend-api/shelter/domain/model/shelter";

/**
 * A minimal owning-shelter view embedded in the animal *detail* response so the
 * client can render "행복보호소 · 서울 강남" and link to the shelter by slug without
 * a second round trip. `city` (구/군) follows the shelter's address disclosure
 * policy — it is absent when the address is hidden; `region` (시/도) is always set.
 */
export class ShelterSummary {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: "시/도 (항상 공개)" })
  region: string;

  @ApiPropertyOptional({ description: "구/군 (주소 공개정책에 따라 노출)" })
  city?: string;

  public static from(shelter: Shelter): ShelterSummary {
    const view = shelter.getAddress.publicView();
    const dto = new ShelterSummary();
    dto.id = shelter.getId.toString();
    dto.slug = shelter.getSlug.raw;
    dto.name = shelter.getName;
    dto.region = view.region;
    dto.city = view.city;
    return dto;
  }
}

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

  @ApiProperty({ description: "운영자 블라인드 여부 (탐색 노출 제외)" })
  blinded: boolean;

  @ApiProperty({ type: Object })
  traits: Record<string, unknown>;

  @ApiProperty({ type: Object })
  health: Record<string, unknown>;

  @ApiProperty({ type: Object })
  intake: Record<string, unknown>;

  @ApiProperty({ type: [Object] })
  photos: { objectKey: string; caption?: string }[];

  @ApiPropertyOptional({
    type: ShelterSummary,
    description: "소유 보호소 요약 (상세 조회에만 포함)",
  })
  shelter?: ShelterSummary;

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
    dto.blinded = animal.isBlinded();
    dto.traits = {
      sex: traits.getSex,
      size: traits.getSize,
      ageMonths: traits.getAgeMonths,
      weightKg: traits.getWeightKg,
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

  /**
   * Detail view that embeds the owning-shelter summary. Falls back to the bare
   * view if the shelter can't be resolved (should not happen for a valid animal).
   */
  public static withShelter(
    animal: Animal,
    shelter: Shelter | null,
  ): AnimalResponse {
    const dto = AnimalResponse.from(animal);
    if (shelter) {
      dto.shelter = ShelterSummary.from(shelter);
    }
    return dto;
  }
}
