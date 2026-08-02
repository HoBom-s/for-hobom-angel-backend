import { AnimalSex } from "src/hb-backend-api/animal/domain/enums/animal-sex.enum";
import { AnimalSize } from "src/hb-backend-api/animal/domain/enums/animal-size.enum";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { PlacementType } from "src/hb-backend-api/animal/domain/enums/placement-type.enum";
import { Animal } from "src/hb-backend-api/animal/domain/model/animal";
import { AnimalPhoto } from "src/hb-backend-api/animal/domain/model/animal-photo";
import { HealthProfile } from "src/hb-backend-api/animal/domain/model/health-profile";
import { IntakeRecord } from "src/hb-backend-api/animal/domain/model/intake-record";
import { Traits } from "src/hb-backend-api/animal/domain/model/traits";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

const traits = () =>
  Traits.of({ sex: AnimalSex.FEMALE, size: AnimalSize.SMALL, ageMonths: 18 });
const health = () => HealthProfile.of({ neutered: true, vaccinated: true });
const intake = () => IntakeRecord.of({ intakeDate: new Date("2026-01-02") });

const register = (over: Partial<Parameters<typeof Animal.register>[0]> = {}) =>
  Animal.register({
    shelterId: ShelterId.generate(),
    name: "초코",
    species: AnimalSpecies.DOG,
    traits: traits(),
    health: health(),
    intake: intake(),
    ...over,
  });

describe("Animal aggregate", () => {
  describe("register", () => {
    it("creates an AVAILABLE animal owned by the shelter", () => {
      const shelterId = ShelterId.generate();
      const animal = register({ shelterId });
      expect(animal.getStatus).toBe(AnimalStatus.AVAILABLE);
      expect(animal.belongsTo(shelterId)).toBe(true);
      expect(animal.acceptsApplications()).toBe(true);
    });

    it("trims the name and rejects an empty one", () => {
      expect(register({ name: "  나비 " }).getName).toBe("나비");
      expect(() => register({ name: "   " })).toThrow("이름");
    });

    it("rejects more than 20 photos", () => {
      const photos = Array.from({ length: 21 }, (_, i) =>
        AnimalPhoto.of({ objectKey: `k${i}` }),
      );
      expect(() => register({ photos })).toThrow("최대");
    });
  });

  describe("eligible placements", () => {
    it("defaults to accepting both adoption and foster", () => {
      const animal = register();
      expect(animal.getEligiblePlacements).toEqual([
        PlacementType.ADOPTION,
        PlacementType.FOSTER,
      ]);
      expect(animal.isEligibleFor(PlacementType.ADOPTION)).toBe(true);
      expect(animal.isEligibleFor(PlacementType.FOSTER)).toBe(true);
    });

    it("honors a foster-only registration", () => {
      const animal = register({ eligiblePlacements: [PlacementType.FOSTER] });
      expect(animal.getEligiblePlacements).toEqual([PlacementType.FOSTER]);
      expect(animal.isEligibleFor(PlacementType.ADOPTION)).toBe(false);
      expect(animal.acceptsApplicationFor(PlacementType.FOSTER)).toBe(true);
      expect(animal.acceptsApplicationFor(PlacementType.ADOPTION)).toBe(false);
    });

    it("de-dupes and normalizes to canonical order", () => {
      const animal = register({
        eligiblePlacements: [
          PlacementType.FOSTER,
          PlacementType.ADOPTION,
          PlacementType.FOSTER,
        ],
      });
      expect(animal.getEligiblePlacements).toEqual([
        PlacementType.ADOPTION,
        PlacementType.FOSTER,
      ]);
    });

    it("rejects an explicitly empty placement set", () => {
      expect(() => register({ eligiblePlacements: [] })).toThrow("신청 유형");
    });

    it("acceptsApplicationFor requires AVAILABLE status", () => {
      const animal = register({ eligiblePlacements: [PlacementType.ADOPTION] });
      animal.reserve();
      expect(animal.isEligibleFor(PlacementType.ADOPTION)).toBe(true);
      expect(animal.acceptsApplicationFor(PlacementType.ADOPTION)).toBe(false);
    });
  });

  describe("status state machine", () => {
    it("AVAILABLE → RESERVED → ADOPTED", () => {
      const animal = register();
      animal.reserve();
      expect(animal.getStatus).toBe(AnimalStatus.RESERVED);
      expect(animal.acceptsApplications()).toBe(false);
      animal.markAdopted();
      expect(animal.getStatus).toBe(AnimalStatus.ADOPTED);
    });

    it("RESERVED → AVAILABLE on release", () => {
      const animal = register();
      animal.reserve();
      animal.release();
      expect(animal.getStatus).toBe(AnimalStatus.AVAILABLE);
    });

    it("RESERVED → FOSTERED → ADOPTED (foster-to-adopt)", () => {
      const animal = register();
      animal.reserve();
      animal.markFostered();
      expect(animal.getStatus).toBe(AnimalStatus.FOSTERED);
      animal.markAdopted();
      expect(animal.getStatus).toBe(AnimalStatus.ADOPTED);
    });

    it("FOSTERED → AVAILABLE when the foster ends", () => {
      const animal = register();
      animal.reserve();
      animal.markFostered();
      animal.endFoster();
      expect(animal.getStatus).toBe(AnimalStatus.AVAILABLE);
    });

    it("ADOPTED → RETURNED → AVAILABLE (re-list)", () => {
      const animal = register();
      animal.reserve();
      animal.markAdopted();
      animal.markReturned();
      expect(animal.getStatus).toBe(AnimalStatus.RETURNED);
      animal.relist();
      expect(animal.getStatus).toBe(AnimalStatus.AVAILABLE);
    });

    it("rejects illegal transitions", () => {
      const available = register();
      expect(() => available.markAdopted()).toThrow("입양 완료");
      expect(() => available.markFostered()).toThrow("임시보호");
      expect(() => available.release()).toThrow("예약 해제");
      expect(() => available.markReturned()).toThrow("반환");

      const adopted = register();
      adopted.reserve();
      adopted.markAdopted();
      expect(() => adopted.reserve()).toThrow("예약");
    });

    it("blind/unblind toggles visibility without touching status", () => {
      const animal = register();
      expect(animal.isBlinded()).toBe(false);
      animal.reserve();
      animal.blind();
      expect(animal.isBlinded()).toBe(true);
      expect(animal.getStatus).toBe(AnimalStatus.RESERVED); // orthogonal
      animal.unblind();
      expect(animal.isBlinded()).toBe(false);
    });
  });

  describe("profile edits", () => {
    it("replaces the editable profile fields", () => {
      const animal = register();
      animal.updateProfile({
        name: "레오",
        species: AnimalSpecies.CAT,
        description: "친화적",
        traits: Traits.of({ sex: AnimalSex.MALE, size: AnimalSize.MEDIUM }),
        health: HealthProfile.of({ neutered: false, vaccinated: true }),
      });
      expect(animal.getName).toBe("레오");
      expect(animal.getSpecies).toBe(AnimalSpecies.CAT);
      expect(animal.getTraits.getSex).toBe(AnimalSex.MALE);
      expect(animal.getHealth.isNeutered).toBe(false);
    });

    it("adds and removes photos, rejecting duplicates and overflow", () => {
      const animal = register();
      animal.addPhoto(AnimalPhoto.of({ objectKey: "a" }));
      expect(() => animal.addPhoto(AnimalPhoto.of({ objectKey: "a" }))).toThrow(
        "이미",
      );
      animal.removePhoto("a");
      expect(animal.getPhotos).toHaveLength(0);
    });
  });
});

describe("Traits", () => {
  const base = { sex: AnimalSex.FEMALE, size: AnimalSize.SMALL };

  it("keeps a fractional weight and defaults it to null when omitted", () => {
    expect(Traits.of({ ...base, weightKg: 4.2 }).getWeightKg).toBe(4.2);
    expect(Traits.of(base).getWeightKg).toBeNull();
  });

  it("rejects a negative weight", () => {
    expect(() => Traits.of({ ...base, weightKg: -1 })).toThrow("몸무게");
  });
});
