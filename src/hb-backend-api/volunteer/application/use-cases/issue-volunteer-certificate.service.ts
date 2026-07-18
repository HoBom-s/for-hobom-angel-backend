import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import {
  CertificateItem,
  VolunteerCertificate,
} from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";
import { VolunteerCertificatePersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-certificate-persistence.port";
import { IssueVolunteerCertificateUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/issue-volunteer-certificate.use-case";

/**
 * Issues a volunteer-service certificate from the member's completed
 * participations: APPROVED signups whose event has ended and was not cancelled.
 * Events are batch-loaded (no N+1); shelter names are resolved once per shelter.
 * The result is snapshotted onto the certificate so it stays verifiable.
 */
@Injectable()
export class IssueVolunteerCertificateService implements IssueVolunteerCertificateUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerSignupQueryPort)
    private readonly signupQueryPort: VolunteerSignupQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerCertificatePersistencePort)
    private readonly persistencePort: VolunteerCertificatePersistencePort,
  ) {}

  public async invoke(userId: string): Promise<VolunteerCertificate> {
    const uid = UserId.fromString(userId);
    const user = await this.userQueryPort.findById(uid);
    if (!user) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }

    const now = new Date();
    const approved = await this.signupQueryPort.findApprovedByVolunteer(uid);
    const events = await this.eventQueryPort.findByIds(
      approved.map((signup) => signup.getEventId),
    );
    const completed = events.filter((event) => this.isCompleted(event, now));
    if (completed.length === 0) {
      throw new BadRequestException(
        "완료된 봉사 참여가 없어 확인서를 발급할 수 없어요.",
      );
    }

    const shelterNames = await this.resolveShelterNames(completed);
    const items: CertificateItem[] = completed.map((event) => ({
      eventId: event.getId.toString(),
      eventTitle: event.getTitle,
      shelterId: event.getShelterId.toString(),
      shelterName: shelterNames.get(event.getShelterId.toString()) ?? "(미상)",
      startAt: event.getStartAt,
      endAt: event.getEndAt,
      minutes: Math.round(
        (event.getEndAt.getTime() - event.getStartAt.getTime()) / 60_000,
      ),
    }));

    return this.persistencePort.save(
      VolunteerCertificate.issue({
        certificateNo: `VC-${randomUUID()}`,
        userId,
        volunteerNickname: user.getNickname.raw,
        items,
        now,
      }),
    );
  }

  private isCompleted(event: VolunteerEvent, now: Date): boolean {
    return (
      event.getEndAt.getTime() < now.getTime() &&
      event.getStatus !== VolunteerEventStatus.CANCELLED
    );
  }

  private async resolveShelterNames(
    events: VolunteerEvent[],
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    const uniqueIds = [
      ...new Set(events.map((event) => event.getShelterId.toString())),
    ];
    for (const id of uniqueIds) {
      const shelter = await this.shelterQueryPort.findById(
        ShelterId.fromString(id),
      );
      if (shelter) {
        names.set(id, shelter.getName);
      }
    }
    return names;
  }
}
