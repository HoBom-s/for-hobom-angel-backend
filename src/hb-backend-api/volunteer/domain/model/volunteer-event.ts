import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerType } from "src/hb-backend-api/volunteer/domain/enums/volunteer-type.enum";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { TransportDetails } from "src/hb-backend-api/volunteer/domain/model/vo/transport-details";
import {
  BusinessRuleViolationError,
  InvalidInputError,
} from "src/shared/exception/domain-exception";

/**
 * Volunteer event aggregate — a shelter's scheduled volunteering with a capped
 * roster. It OWNS the capacity and schedule invariants: a signup can only be
 * reserved while OPEN, before it starts, and below capacity; the `signedUpCount`
 * is guarded by optimistic concurrency so two simultaneous signups can't
 * oversubscribe. The signup records themselves are a separate aggregate.
 */
export class VolunteerEvent {
  private constructor(
    private readonly id: VolunteerEventId,
    private readonly shelterId: ShelterId,
    private title: string,
    private description: string,
    private readonly startAt: Date,
    private readonly endAt: Date,
    private readonly capacity: number,
    private signedUpCount: number,
    private status: VolunteerEventStatus,
    private readonly type: VolunteerType,
    private readonly transport: TransportDetails | null,
    private readonly version: number,
  ) {}

  public static open(params: {
    shelterId: ShelterId;
    title: string;
    description?: string;
    startAt: Date;
    endAt: Date;
    capacity: number;
    type?: VolunteerType;
    transport?: TransportDetails | null;
  }): VolunteerEvent {
    if (!params.title?.trim()) {
      throw new InvalidInputError("봉사 제목이 필요해요.");
    }
    if (!Number.isInteger(params.capacity) || params.capacity < 1) {
      throw new InvalidInputError("모집 인원은 1명 이상이어야 해요.");
    }
    if (
      !(params.startAt instanceof Date) ||
      !(params.endAt instanceof Date) ||
      params.startAt.getTime() >= params.endAt.getTime()
    ) {
      throw new InvalidInputError("봉사 시작/종료 시간이 올바르지 않아요.");
    }
    const type = params.type ?? VolunteerType.GENERAL;
    const transport = params.transport ?? null;
    VolunteerEvent.assertTransportMatchesType(type, transport);
    return new VolunteerEvent(
      VolunteerEventId.generate(),
      params.shelterId,
      params.title.trim(),
      params.description?.trim() ?? "",
      params.startAt,
      params.endAt,
      params.capacity,
      0,
      VolunteerEventStatus.OPEN,
      type,
      transport,
      0,
    );
  }

  public static reconstitute(params: {
    id: VolunteerEventId;
    shelterId: ShelterId;
    title: string;
    description: string;
    startAt: Date;
    endAt: Date;
    capacity: number;
    signedUpCount: number;
    status: VolunteerEventStatus;
    type: VolunteerType;
    transport: TransportDetails | null;
    version: number;
  }): VolunteerEvent {
    return new VolunteerEvent(
      params.id,
      params.shelterId,
      params.title,
      params.description,
      params.startAt,
      params.endAt,
      params.capacity,
      params.signedUpCount,
      params.status,
      params.type,
      params.transport,
      params.version,
    );
  }

  /** OVERSEAS needs transport logistics; GENERAL must carry none. */
  private static assertTransportMatchesType(
    type: VolunteerType,
    transport: TransportDetails | null,
  ): void {
    if (type === VolunteerType.OVERSEAS && !transport) {
      throw new InvalidInputError(
        "해외 이동봉사는 출발/도착·항공 정보가 필요해요.",
      );
    }
    if (type === VolunteerType.GENERAL && transport) {
      throw new InvalidInputError("일반 봉사에는 이동 정보를 넣을 수 없어요.");
    }
  }

  // ── capacity ────────────────────────────────────────────────────
  /** Hold a slot for a new signup; enforces open/timing/capacity. */
  public reserveSlot(now: Date): void {
    if (this.status !== VolunteerEventStatus.OPEN) {
      throw new BusinessRuleViolationError("모집 중인 봉사가 아니에요.");
    }
    if (now.getTime() >= this.startAt.getTime()) {
      throw new BusinessRuleViolationError("이미 시작된 봉사예요.");
    }
    if (this.signedUpCount >= this.capacity) {
      throw new BusinessRuleViolationError("모집 인원이 찼어요.");
    }
    this.signedUpCount += 1;
  }

  /** Return a slot when a volunteer withdraws. */
  public releaseSlot(): void {
    if (this.signedUpCount > 0) {
      this.signedUpCount -= 1;
    }
  }

  // ── status transitions ──────────────────────────────────────────
  public close(): void {
    this.assertStatus([VolunteerEventStatus.OPEN], "마감");
    this.status = VolunteerEventStatus.CLOSED;
  }

  public cancel(): void {
    this.assertStatus(
      [VolunteerEventStatus.OPEN, VolunteerEventStatus.CLOSED],
      "취소",
    );
    this.status = VolunteerEventStatus.CANCELLED;
  }

  // ── profile edits ───────────────────────────────────────────────
  public updateDetails(params: { title: string; description?: string }): void {
    if (!params.title?.trim()) {
      throw new InvalidInputError("봉사 제목이 필요해요.");
    }
    this.title = params.title.trim();
    this.description = params.description?.trim() ?? "";
  }

  // ── predicates ──────────────────────────────────────────────────
  public acceptsSignups(now: Date): boolean {
    return (
      this.status === VolunteerEventStatus.OPEN &&
      now.getTime() < this.startAt.getTime() &&
      this.signedUpCount < this.capacity
    );
  }

  public isFull(): boolean {
    return this.signedUpCount >= this.capacity;
  }

  public belongsTo(shelterId: ShelterId): boolean {
    return this.shelterId.equals(shelterId);
  }

  private assertStatus(allowed: VolunteerEventStatus[], action: string): void {
    if (!allowed.includes(this.status)) {
      throw new BusinessRuleViolationError(
        `현재 상태(${this.status})에서는 ${action}할 수 없어요.`,
      );
    }
  }

  // ── accessors ───────────────────────────────────────────────────
  public get getId(): VolunteerEventId {
    return this.id;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getTitle(): string {
    return this.title;
  }
  public get getDescription(): string {
    return this.description;
  }
  public get getStartAt(): Date {
    return this.startAt;
  }
  public get getEndAt(): Date {
    return this.endAt;
  }
  public get getCapacity(): number {
    return this.capacity;
  }
  public get getSignedUpCount(): number {
    return this.signedUpCount;
  }
  public get getStatus(): VolunteerEventStatus {
    return this.status;
  }
  public get getType(): VolunteerType {
    return this.type;
  }
  public get getTransport(): TransportDetails | null {
    return this.transport;
  }
  public get getVersion(): number {
    return this.version;
  }
}
