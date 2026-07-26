import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";
import { AdoptionApplication } from "src/hb-backend-api/adoption/domain/model/adoption-application";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";
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

  public async findPageByShelter(
    shelterId: ShelterId,
    status: AdoptionApplicationStatus | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<AdoptionApplication>> {
    const docs = await this.repository.findPageByShelter(
      shelterId.raw,
      status,
      this.toCursorId(cursor),
      limit,
    );
    return this.toPage(docs, limit);
  }

  public async findPageByApplicant(
    applicantId: UserId,
    status: AdoptionApplicationStatus | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<AdoptionApplication>> {
    const docs = await this.repository.findPageByApplicant(
      applicantId.raw,
      status,
      this.toCursorId(cursor),
      limit,
    );
    return this.toPage(docs, limit);
  }

  private toCursorId(cursor: string | null): Types.ObjectId | null {
    return cursor && Types.ObjectId.isValid(cursor)
      ? new Types.ObjectId(cursor)
      : null;
  }

  private toPage(
    docs: AdoptionApplicationEntity[],
    limit: number,
  ): Page<AdoptionApplication> {
    const hasNext = docs.length > limit;
    const pageDocs = hasNext ? docs.slice(0, limit) : docs;
    const last = pageDocs[pageDocs.length - 1];
    return {
      items: pageDocs.map(toDomain),
      hasNext,
      nextCursor: hasNext && last ? String(last._id) : null,
    };
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
