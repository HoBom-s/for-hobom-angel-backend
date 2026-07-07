import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ApprovalRequest } from "src/hb-backend-api/approval/domain/model/approval-request";
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
}
