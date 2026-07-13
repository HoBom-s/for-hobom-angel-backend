import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import { AnimalPhoto } from "src/hb-backend-api/animal/domain/model/animal-photo";
import { HealthProfile } from "src/hb-backend-api/animal/domain/model/health-profile";
import { IntakeRecord } from "src/hb-backend-api/animal/domain/model/intake-record";
import { Traits } from "src/hb-backend-api/animal/domain/model/traits";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalMutablePatch } from "src/hb-backend-api/animal/domain/repositories/animal.repository";

/** Rehydrates a persisted document into the {@link Animal} aggregate. */
export function toDomain(doc: AnimalEntity): Animal {
  return Animal.reconstitute({
    id: AnimalId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    name: doc.name,
    species: doc.species,
    description: doc.description ?? "",
    traits: Traits.of({
      sex: doc.traits.sex,
      size: doc.traits.size,
      ageMonths: doc.traits.ageMonths,
      breed: doc.traits.breed,
      color: doc.traits.color,
      personality: doc.traits.personality,
    }),
    health: HealthProfile.of({
      neutered: doc.health.neutered,
      vaccinated: doc.health.vaccinated,
      microchipId: doc.health.microchipId,
      notes: doc.health.notes,
    }),
    intake: IntakeRecord.of({
      intakeDate: doc.intake.intakeDate,
      rescueStory: doc.intake.rescueStory,
      noticeNumber: doc.intake.noticeNumber,
    }),
    photos: (doc.photos ?? []).map((p) =>
      AnimalPhoto.of({ objectKey: p.objectKey, caption: p.caption }),
    ),
    status: doc.status,
    blinded: doc.blinded ?? false,
    version: doc.version ?? 0,
  });
}

/** Builds the insert document for a newly registered animal. */
export function toInsertDoc(animal: Animal): Partial<AnimalEntity> {
  return {
    _id: animal.getId.raw,
    shelterId: animal.getShelterId.raw,
    name: animal.getName,
    species: animal.getSpecies,
    description: animal.getDescription,
    traits: toTraitsDoc(animal),
    health: toHealthDoc(animal),
    intake: {
      intakeDate: animal.getIntake.getIntakeDate,
      rescueStory: animal.getIntake.getRescueStory,
      noticeNumber: animal.getIntake.getNoticeNumber,
    },
    photos: animal.getPhotos.map((p) => p.toPlain()),
    status: animal.getStatus,
    blinded: animal.isBlinded(),
    version: animal.getVersion,
  };
}

/** The mutable fields to persist on a version-guarded save. */
export function toMutablePatch(animal: Animal): AnimalMutablePatch {
  return {
    name: animal.getName,
    species: animal.getSpecies,
    description: animal.getDescription,
    traits: toTraitsDoc(animal),
    health: toHealthDoc(animal),
    photos: animal.getPhotos.map((p) => p.toPlain()),
    status: animal.getStatus,
    blinded: animal.isBlinded(),
  };
}

function toTraitsDoc(animal: Animal) {
  const t = animal.getTraits;
  return {
    sex: t.getSex,
    size: t.getSize,
    ageMonths: t.getAgeMonths,
    breed: t.getBreed,
    color: t.getColor,
    personality: t.getPersonality,
  };
}

function toHealthDoc(animal: Animal) {
  const h = animal.getHealth;
  return {
    neutered: h.isNeutered,
    vaccinated: h.isVaccinated,
    microchipId: h.getMicrochipId,
    notes: h.getNotes,
  };
}
