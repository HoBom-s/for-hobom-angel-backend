import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";
import { FosterApplicationRepository } from "src/hb-backend-api/foster/domain/repositories/foster-application.repository";
import { toDomain } from "src/hb-backend-api/foster/adapters/out/foster-application.mapper";

@Injectable()
export class FosterApplicationQueryAdapter implements FosterApplicationQueryPort {
  constructor(
    @Inject(DIToken.FosterModule.FosterApplicationRepository)
    private readonly repository: FosterApplicationRepository,
  ) {}

  public async findById(
    id: FosterApplicationId,
  ): Promise<FosterApplication | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public countByApplicantAndStatus(
    applicantId: UserId,
    status: FosterApplicationStatus,
  ): Promise<number> {
    return this.repository.countByApplicantAndStatus(applicantId.raw, status);
  }

  public countByShelterAndStatus(
    shelterId: ShelterId,
    status: FosterApplicationStatus,
  ): Promise<number> {
    return this.repository.countByShelterAndStatus(shelterId.raw, status);
  }
}
