import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Types } from "mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AuditAction } from "src/hb-backend-api/audit/domain/enums/audit-action.enum";
import { AuditEvent } from "src/hb-backend-api/audit/domain/model/audit-event";
import { AuditPersistencePort } from "src/hb-backend-api/audit/domain/ports/out/audit-persistence.port";
import { PersonalData } from "src/hb-backend-api/user/domain/model/personal-data";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { PersonalDataPort } from "src/hb-backend-api/user/domain/ports/out/personal-data.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  ExportPersonalDataCommand,
  ExportPersonalDataUseCase,
} from "src/hb-backend-api/dsar/domain/ports/in/export-personal-data.use-case";

/**
 * DSAR access request. Operator-only. Reads the subject's PII, then records an
 * EXPORT_PII audit BEFORE returning it to the caller — no PII is ever revealed
 * without a durable trail of who exported whose data, and why. The decrypted PII
 * lives only in the response body, which the access-log interceptor does not log.
 */
@Injectable()
export class ExportPersonalDataService implements ExportPersonalDataUseCase {
  constructor(
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.PersonalDataPort)
    private readonly personalDataPort: PersonalDataPort,
    @Inject(DIToken.AuditModule.AuditPersistencePort)
    private readonly audit: AuditPersistencePort,
  ) {}

  public async invoke(
    command: ExportPersonalDataCommand,
  ): Promise<PersonalData> {
    await this.assertPlatformAdmin(command.actorId);
    if (!Types.ObjectId.isValid(command.subjectId)) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }

    const data = await this.personalDataPort.read(
      UserId.fromString(command.subjectId),
    );
    if (!data) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }

    await this.audit.record(
      AuditEvent.of({
        action: AuditAction.EXPORT_PII,
        actorId: command.actorId,
        subjectUserId: command.subjectId,
        reason: command.reason ?? null,
      }),
    );

    return data;
  }

  private async assertPlatformAdmin(actorId: string): Promise<void> {
    const actor = await this.userQueryPort.findById(UserId.fromString(actorId));
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 열람할 수 있어요.");
    }
  }
}
