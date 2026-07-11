import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { Answer } from "src/hb-backend-api/adoption/domain/model/answer";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";

/**
 * An applicant's adoption request for one animal. It carries an immutable
 * snapshot of the answers (and the questionnaire version they answered), so a
 * later questionnaire edit never reinterprets a past submission. Its status
 * rides the approval engine: PENDING while the shelter reviews, then the
 * decision callback approves/rejects it alongside the animal transition.
 */
export class AdoptionApplication {
  private constructor(
    private readonly id: ApplicationId,
    private readonly animalId: AnimalId,
    private readonly shelterId: ShelterId,
    private readonly applicantId: UserId,
    private readonly questionnaireVersion: number,
    private readonly answers: Answer[],
    private status: AdoptionApplicationStatus,
    private decidedReason: string | null,
    private readonly version: number,
  ) {}

  public static submit(params: {
    animalId: AnimalId;
    shelterId: ShelterId;
    applicantId: UserId;
    questionnaireVersion: number;
    answers: Answer[];
  }): AdoptionApplication {
    return new AdoptionApplication(
      ApplicationId.generate(),
      params.animalId,
      params.shelterId,
      params.applicantId,
      params.questionnaireVersion,
      params.answers,
      AdoptionApplicationStatus.PENDING,
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: ApplicationId;
    animalId: AnimalId;
    shelterId: ShelterId;
    applicantId: UserId;
    questionnaireVersion: number;
    answers: Answer[];
    status: AdoptionApplicationStatus;
    decidedReason: string | null;
    version: number;
  }): AdoptionApplication {
    return new AdoptionApplication(
      params.id,
      params.animalId,
      params.shelterId,
      params.applicantId,
      params.questionnaireVersion,
      params.answers,
      params.status,
      params.decidedReason,
      params.version,
    );
  }

  public approve(): void {
    this.assertPending("승인");
    this.status = AdoptionApplicationStatus.APPROVED;
  }

  public reject(reason: string): void {
    this.assertPending("반려");
    if (!reason?.trim()) {
      throw new Error("반려 사유가 필요해요.");
    }
    this.status = AdoptionApplicationStatus.REJECTED;
    this.decidedReason = reason.trim();
  }

  public withdraw(): void {
    this.assertPending("철회");
    this.status = AdoptionApplicationStatus.WITHDRAWN;
  }

  public isPending(): boolean {
    return this.status === AdoptionApplicationStatus.PENDING;
  }

  private assertPending(action: string): void {
    if (this.status !== AdoptionApplicationStatus.PENDING) {
      throw new Error(
        `이미 처리된 신청이에요(${this.status}). ${action}할 수 없어요.`,
      );
    }
  }

  public get getId(): ApplicationId {
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
  public get getStatus(): AdoptionApplicationStatus {
    return this.status;
  }
  public get getDecidedReason(): string | null {
    return this.decidedReason;
  }
  public get getVersion(): number {
    return this.version;
  }
}
