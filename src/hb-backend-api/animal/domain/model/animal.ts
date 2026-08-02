import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { AnimalSpecies } from "src/hb-backend-api/animal/domain/enums/animal-species.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
import { PlacementType } from "src/hb-backend-api/animal/domain/enums/placement-type.enum";
import { AnimalPhoto } from "src/hb-backend-api/animal/domain/model/animal-photo";
import { HealthProfile } from "src/hb-backend-api/animal/domain/model/health-profile";
import { IntakeRecord } from "src/hb-backend-api/animal/domain/model/intake-record";
import { Traits } from "src/hb-backend-api/animal/domain/model/traits";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";

/**
 * Animal aggregate — a shelter's adoptable friend, and the consistency boundary
 * for its adoption lifecycle. This aggregate OWNS its status transitions: the
 * adoption/foster approval callbacks ask it to move (reserve → markAdopted /
 * markFostered), they never set the field. Keeping every rule
 * (AVAILABLE⇄RESERVED→ADOPTED/FOSTERED→…) here means one place can't be bypassed.
 *
 * `shelterId` is the owning tenant; profile content (traits, health, photos) is
 * editable by that shelter's staff, but the intake record is historical.
 */
export class Animal {
  private constructor(
    private readonly id: AnimalId,
    private readonly shelterId: ShelterId,
    private name: string,
    private species: AnimalSpecies,
    private description: string,
    private traits: Traits,
    private health: HealthProfile,
    private readonly intake: IntakeRecord,
    private photos: AnimalPhoto[],
    private status: AnimalStatus,
    private eligiblePlacements: PlacementType[],
    private blinded: boolean,
    private readonly version: number,
  ) {}

  private static readonly MAX_PHOTOS = 20;

  /** Canonical order; also the default (offered for both) when unspecified. */
  private static readonly ALL_PLACEMENTS: PlacementType[] = [
    PlacementType.ADOPTION,
    PlacementType.FOSTER,
  ];

  /**
   * De-dupes to canonical order and drops unknown values. An AVAILABLE animal
   * must accept at least one placement, so an explicitly empty set is rejected.
   */
  private static normalizePlacements(
    input: PlacementType[] | undefined,
  ): PlacementType[] {
    const chosen = new Set(input ?? Animal.ALL_PLACEMENTS);
    const normalized = Animal.ALL_PLACEMENTS.filter((p) => chosen.has(p));
    if (normalized.length === 0) {
      throw new Error("입양/임시보호 중 최소 한 가지 신청 유형이 필요해요.");
    }
    return normalized;
  }

  public static register(params: {
    shelterId: ShelterId;
    name: string;
    species: AnimalSpecies;
    description?: string;
    traits: Traits;
    health: HealthProfile;
    intake: IntakeRecord;
    photos?: AnimalPhoto[];
    /** Application types this animal accepts; defaults to both when omitted. */
    eligiblePlacements?: PlacementType[];
  }): Animal {
    if (!params.name?.trim()) {
      throw new Error("동물 이름이 필요해요.");
    }
    const photos = params.photos ?? [];
    if (photos.length > Animal.MAX_PHOTOS) {
      throw new Error(`사진은 최대 ${Animal.MAX_PHOTOS}장까지예요.`);
    }
    return new Animal(
      AnimalId.generate(),
      params.shelterId,
      params.name.trim(),
      params.species,
      params.description?.trim() ?? "",
      params.traits,
      params.health,
      params.intake,
      photos,
      AnimalStatus.AVAILABLE,
      Animal.normalizePlacements(params.eligiblePlacements),
      false,
      0,
    );
  }

  public static reconstitute(params: {
    id: AnimalId;
    shelterId: ShelterId;
    name: string;
    species: AnimalSpecies;
    description: string;
    traits: Traits;
    health: HealthProfile;
    intake: IntakeRecord;
    photos: AnimalPhoto[];
    status: AnimalStatus;
    eligiblePlacements: PlacementType[];
    blinded: boolean;
    version: number;
  }): Animal {
    return new Animal(
      params.id,
      params.shelterId,
      params.name,
      params.species,
      params.description,
      params.traits,
      params.health,
      params.intake,
      params.photos,
      params.status,
      params.eligiblePlacements,
      params.blinded,
      params.version,
    );
  }

  // ── profile edits (shelter staff) ───────────────────────────────
  public updateProfile(params: {
    name: string;
    species: AnimalSpecies;
    description?: string;
    traits: Traits;
    health: HealthProfile;
  }): void {
    if (!params.name?.trim()) {
      throw new Error("동물 이름이 필요해요.");
    }
    this.name = params.name.trim();
    this.species = params.species;
    this.description = params.description?.trim() ?? "";
    this.traits = params.traits;
    this.health = params.health;
  }

  public addPhoto(photo: AnimalPhoto): void {
    if (this.photos.length >= Animal.MAX_PHOTOS) {
      throw new Error(`사진은 최대 ${Animal.MAX_PHOTOS}장까지예요.`);
    }
    if (this.photos.some((p) => p.hasKey(photo.getObjectKey))) {
      throw new Error("이미 등록된 사진이에요.");
    }
    this.photos.push(photo);
  }

  public removePhoto(objectKey: string): void {
    this.photos = this.photos.filter((p) => !p.hasKey(objectKey));
  }

  // ── status transitions (invariant-enforcing) ────────────────────
  /** An application started; hold the animal so no one else can apply. */
  public reserve(): void {
    this.assertStatus([AnimalStatus.AVAILABLE], "예약");
    this.status = AnimalStatus.RESERVED;
  }

  /** The in-progress application was cancelled/rejected; reopen. */
  public release(): void {
    this.assertStatus([AnimalStatus.RESERVED], "예약 해제");
    this.status = AnimalStatus.AVAILABLE;
  }

  /** Adoption approved (from a reservation, or converting a foster to adopt). */
  public markAdopted(): void {
    this.assertStatus(
      [AnimalStatus.RESERVED, AnimalStatus.FOSTERED],
      "입양 완료",
    );
    this.status = AnimalStatus.ADOPTED;
  }

  /** Foster (임시보호) approved. */
  public markFostered(): void {
    this.assertStatus([AnimalStatus.RESERVED], "임시보호 시작");
    this.status = AnimalStatus.FOSTERED;
  }

  /** Foster ended without adoption; reopen. */
  public endFoster(): void {
    this.assertStatus([AnimalStatus.FOSTERED], "임시보호 종료");
    this.status = AnimalStatus.AVAILABLE;
  }

  /** Returned after adoption (파양/반환). */
  public markReturned(): void {
    this.assertStatus([AnimalStatus.ADOPTED], "반환");
    this.status = AnimalStatus.RETURNED;
  }

  /** Re-list a returned animal for adoption again. */
  public relist(): void {
    this.assertStatus([AnimalStatus.RETURNED], "재등록");
    this.status = AnimalStatus.AVAILABLE;
  }

  /**
   * Operator moderation: hide/reveal the listing from public discovery. Blinding
   * is orthogonal to status (a RESERVED animal can be blinded) and reversible.
   */
  public blind(): void {
    this.blinded = true;
  }

  public unblind(): void {
    this.blinded = false;
  }

  // ── predicates ──────────────────────────────────────────────────
  public isBlinded(): boolean {
    return this.blinded;
  }

  public isAvailable(): boolean {
    return this.status === AnimalStatus.AVAILABLE;
  }

  /** Whether a new adoption/foster application may be started. */
  public acceptsApplications(): boolean {
    return this.status === AnimalStatus.AVAILABLE;
  }

  /** Whether this animal is offered for the given placement type (any status). */
  public isEligibleFor(placement: PlacementType): boolean {
    return this.eligiblePlacements.includes(placement);
  }

  /** Whether a new application of the given placement type may be started now. */
  public acceptsApplicationFor(placement: PlacementType): boolean {
    return this.acceptsApplications() && this.isEligibleFor(placement);
  }

  public belongsTo(shelterId: ShelterId): boolean {
    return this.shelterId.equals(shelterId);
  }

  private assertStatus(allowed: AnimalStatus[], action: string): void {
    if (!allowed.includes(this.status)) {
      throw new Error(`현재 상태(${this.status})에서는 ${action}할 수 없어요.`);
    }
  }

  // ── accessors ───────────────────────────────────────────────────
  public get getId(): AnimalId {
    return this.id;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getName(): string {
    return this.name;
  }
  public get getSpecies(): AnimalSpecies {
    return this.species;
  }
  public get getDescription(): string {
    return this.description;
  }
  public get getTraits(): Traits {
    return this.traits;
  }
  public get getHealth(): HealthProfile {
    return this.health;
  }
  public get getIntake(): IntakeRecord {
    return this.intake;
  }
  public get getPhotos(): AnimalPhoto[] {
    return [...this.photos];
  }
  public get getStatus(): AnimalStatus {
    return this.status;
  }
  public get getEligiblePlacements(): PlacementType[] {
    return [...this.eligiblePlacements];
  }
  public get getVersion(): number {
    return this.version;
  }
}
