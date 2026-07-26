import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { ApprovalType } from "src/hb-backend-api/approval/domain/enums/approval-type.enum";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
import { ApprovalRequestEntity } from "src/hb-backend-api/approval/domain/model/approval-request.entity";
import { ApprovalId } from "src/hb-backend-api/approval/domain/model/vo/approval-id.vo";
import { ApprovalQueryPort } from "src/hb-backend-api/approval/domain/ports/out/approval-query.port";
import { ApprovalRepository } from "src/hb-backend-api/approval/domain/repositories/approval.repository";
import { toDomain } from "src/hb-backend-api/approval/adapters/out/approval.mapper";

@Injectable()
export class ApprovalQueryAdapter implements ApprovalQueryPort {
  constructor(
    @Inject(DIToken.ApprovalModule.ApprovalRepository)
    private readonly approvalRepository: ApprovalRepository,
  ) {}

  public async findById(id: ApprovalId): Promise<ApprovalRequest | null> {
    const doc = await this.approvalRepository.findRequestById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findPendingByTypeAndShelter(
    type: ApprovalType,
    shelterId: string,
    limit: number,
  ): Promise<ApprovalRequest[]> {
    const docs = await this.approvalRepository.findPendingByTypeAndShelter(
      type,
      shelterId,
      limit,
    );
    return docs.map(toDomain);
  }

  public async findPending(
    type: ApprovalType | null,
    cursor: string | null,
    limit: number,
  ): Promise<Page<ApprovalRequest>> {
    const cursorId =
      cursor && Types.ObjectId.isValid(cursor)
        ? new Types.ObjectId(cursor)
        : null;
    const docs = await this.approvalRepository.findPendingPage(
      type,
      cursorId,
      limit,
    );
    const hasNext = docs.length > limit;
    const pageDocs = hasNext ? docs.slice(0, limit) : docs;
    const last = pageDocs[pageDocs.length - 1] as
      ApprovalRequestEntity | undefined;
    return {
      items: pageDocs.map(toDomain),
      hasNext,
      nextCursor: hasNext && last ? String(last._id) : null,
    };
  }

  public async countPendingByType(): Promise<Record<ApprovalType, number>> {
    const counts = Object.values(ApprovalType).reduce(
      (acc, type) => {
        acc[type] = 0;
        return acc;
      },
      {} as Record<ApprovalType, number>,
    );
    for (const row of await this.approvalRepository.countPendingByType()) {
      counts[row.type] = row.count;
    }
    return counts;
  }
}
