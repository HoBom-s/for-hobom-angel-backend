import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterApplication } from "src/hb-backend-api/foster/domain/model/foster-application";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";
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

  public async findPageByShelter(
    shelterId: ShelterId,
    status: FosterApplicationStatus | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<FosterApplication>> {
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
    status: FosterApplicationStatus | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<FosterApplication>> {
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
    docs: FosterApplicationEntity[],
    limit: number,
  ): Page<FosterApplication> {
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

  public countByStatus(status: FosterApplicationStatus): Promise<number> {
    return this.repository.countByStatus(status);
  }
}
