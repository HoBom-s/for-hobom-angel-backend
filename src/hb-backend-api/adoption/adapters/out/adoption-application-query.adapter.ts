import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";
import { AdoptionApplicationRepository } from "src/hb-backend-api/adoption/domain/repositories/adoption-application.repository";
import { toDomain } from "src/hb-backend-api/adoption/adapters/out/adoption-application.mapper";

@Injectable()
export class AdoptionApplicationQueryAdapter implements AdoptionApplicationQueryPort {
  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationRepository)
    private readonly repository: AdoptionApplicationRepository,
  ) {}

  public async findById(
    id: ApplicationId,
  ): Promise<AdoptionApplication | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public countByApplicantAndStatus(
    applicantId: UserId,
    status: AdoptionApplicationStatus,
  ): Promise<number> {
    return this.repository.countByApplicantAndStatus(applicantId.raw, status);
  }

  public countByShelterAndStatus(
    shelterId: ShelterId,
    status: AdoptionApplicationStatus,
  ): Promise<number> {
    return this.repository.countByShelterAndStatus(shelterId.raw, status);
  }

  public countByShelterAndStatusBetween(
    shelterId: ShelterId,
    status: AdoptionApplicationStatus,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.repository.countByShelterAndStatusBetween(
      shelterId.raw,
      status,
      from,
      to,
    );
  }

  public countByStatus(status: AdoptionApplicationStatus): Promise<number> {
    return this.repository.countByStatus(status);
  }

  public countByStatusBetween(
    status: AdoptionApplicationStatus,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.repository.countByStatusBetween(status, from, to);
  }
}
