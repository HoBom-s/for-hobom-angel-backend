import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { Answer } from "src/hb-backend-api/questionnaire/domain/model/answer";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";

/**
 * A member's foster (임시보호) request for one animal. Like an adoption
 * application it carries an answer snapshot and rides the approval engine, but it
 * adds a care period: `plannedEndDate` may be null (indefinite / 무기한), and once
 * APPROVED the foster is active until it ends — either EXPIRED (the date passed)
 * or EARLY_TERMINATED — recorded here as `endedAt`/`endReason`.
 */
export class FosterApplication {
  private constructor(
    private readonly id: FosterApplicationId,
    private readonly animalId: AnimalId,
    private readonly shelterId: ShelterId,
    private readonly applicantId: UserId,
    private readonly questionnaireVersion: number,
    private readonly answers: Answer[],
    private readonly plannedEndDate: Date | null,
    private status: FosterApplicationStatus,
    private decidedReason: string | null,
    private endedAt: Date | null,
    private endReason: FosterEndReason | null,
    private readonly version: number,
  ) {}

  public static submit(params: {
    animalId: AnimalId;
    shelterId: ShelterId;
    applicantId: UserId;
    questionnaireVersion: number;
    answers: Answer[];
    plannedEndDate?: Date | null;
  }): FosterApplication {
    if (
      params.plannedEndDate != null &&
      (!(params.plannedEndDate instanceof Date) ||
        isNaN(params.plannedEndDate.getTime()))
    ) {
      throw new Error("임시보호 종료 예정일이 올바르지 않아요.");
    }
    return new FosterApplication(
      FosterApplicationId.generate(),
      params.animalId,
      params.shelterId,
      params.applicantId,
      params.questionnaireVersion,
      params.answers,
      params.plannedEndDate ?? null,
      FosterApplicationStatus.PENDING,
      null,
      null,
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: FosterApplicationId;
    animalId: AnimalId;
    shelterId: ShelterId;
    applicantId: UserId;
    questionnaireVersion: number;
    answers: Answer[];
    plannedEndDate: Date | null;
    status: FosterApplicationStatus;
    decidedReason: string | null;
    endedAt: Date | null;
    endReason: FosterEndReason | null;
    version: number;
  }): FosterApplication {
    return new FosterApplication(
      params.id,
      params.animalId,
      params.shelterId,
      params.applicantId,
      params.questionnaireVersion,
      params.answers,
      params.plannedEndDate,
      params.status,
      params.decidedReason,
      params.endedAt,
      params.endReason,
      params.version,
    );
  }

  public approve(): void {
    this.assertPending("승인");
    this.status = FosterApplicationStatus.APPROVED;
  }

  public reject(reason: string): void {
    this.assertPending("반려");
    if (!reason?.trim()) {
      throw new Error("반려 사유가 필요해요.");
    }
    this.status = FosterApplicationStatus.REJECTED;
    this.decidedReason = reason.trim();
  }

  public withdraw(): void {
    this.assertPending("철회");
    this.status = FosterApplicationStatus.WITHDRAWN;
  }

  /** End an active foster (expiry or early termination). */
  public terminate(reason: FosterEndReason, at: Date): void {
    if (!this.isActiveFoster()) {
      throw new Error("진행 중인 임시보호가 아니에요.");
    }
    this.endedAt = at;
    this.endReason = reason;
  }

  public isPending(): boolean {
    return this.status === FosterApplicationStatus.PENDING;
  }

  /** APPROVED and not yet ended — the animal is currently in this member's care. */
  public isActiveFoster(): boolean {
    return (
      this.status === FosterApplicationStatus.APPROVED && this.endedAt === null
    );
  }

  private assertPending(action: string): void {
    if (this.status !== FosterApplicationStatus.PENDING) {
      throw new Error(
        `이미 처리된 신청이에요(${this.status}). ${action}할 수 없어요.`,
      );
    }
  }

  public get getId(): FosterApplicationId {
    return this.id;
  }
  public get getAnimalId(): AnimalId {
    return this.animalId;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getApplicantId(): UserId {
    return this.applicantId;
  }
  public get getQuestionnaireVersion(): number {
    return this.questionnaireVersion;
  }
  public get getAnswers(): Answer[] {
    return [...this.answers];
  }
  public get getPlannedEndDate(): Date | null {
    return this.plannedEndDate;
  }
  public get getStatus(): FosterApplicationStatus {
    return this.status;
  }
  public get getDecidedReason(): string | null {
    return this.decidedReason;
  }
  public get getEndedAt(): Date | null {
    return this.endedAt;
  }
  public get getEndReason(): FosterEndReason | null {
    return this.endReason;
  }
  public get getVersion(): number {
    return this.version;
  }
}
