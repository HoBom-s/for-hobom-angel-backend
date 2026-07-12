import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Report } from "src/hb-backend-api/report/domain/model/report";
import { ReportPersistencePort } from "src/hb-backend-api/report/domain/ports/out/report-persistence.port";
import { ReportRepository } from "src/hb-backend-api/report/domain/repositories/report.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/report/adapters/out/report.mapper";

@Injectable()
export class ReportPersistenceAdapter implements ReportPersistencePort {
  constructor(
    @Inject(DIToken.ReportModule.ReportRepository)
    private readonly repository: ReportRepository,
  ) {}

  public async create(report: Report): Promise<void> {
    await this.repository.insert(toInsertDoc(report));
  }

  public async save(report: Report): Promise<void> {
    await this.repository.update(
      report.getId.raw,
      report.getVersion,
      toMutablePatch(report),
    );
  }
}
