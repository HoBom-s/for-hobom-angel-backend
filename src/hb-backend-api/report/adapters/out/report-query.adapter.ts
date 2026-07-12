import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Report } from "src/hb-backend-api/report/domain/model/report";
import { ReportId } from "src/hb-backend-api/report/domain/model/vo/report-id.vo";
import { ReportQueryPort } from "src/hb-backend-api/report/domain/ports/out/report-query.port";
import { ReportRepository } from "src/hb-backend-api/report/domain/repositories/report.repository";
import { toDomain } from "src/hb-backend-api/report/adapters/out/report.mapper";

@Injectable()
export class ReportQueryAdapter implements ReportQueryPort {
  constructor(
    @Inject(DIToken.ReportModule.ReportRepository)
    private readonly repository: ReportRepository,
  ) {}

  public async findById(id: ReportId): Promise<Report | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findPending(limit: number): Promise<Report[]> {
    const docs = await this.repository.findPending(limit);
    return docs.map(toDomain);
  }
}
