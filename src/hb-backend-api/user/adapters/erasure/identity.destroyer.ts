import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { RetentionRule } from "src/shared/erasure/retention-rule";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { PersonalDataPort } from "src/hb-backend-api/user/domain/ports/out/personal-data.port";

/**
 * IDENTITY category. Anonymizes the member row in place (real name, phone, email,
 * nickname → tombstone), keeping the row so adoption/message/audit FKs survive.
 * Runs last (high priority number) so content referencing the user is erased
 * first. Idempotent — a re-run on an already-tombstoned row reports 0.
 */
@Injectable()
export class IdentityDestroyer extends Destroyer {
  public readonly key = "user.identity";
  public readonly priority = 100;
  public readonly rule: RetentionRule = {
    category: DataCategory.IDENTITY,
    disposition: Disposition.ANONYMIZE,
    legalBasis:
      "right to erasure; row kept as an anonymized tombstone for referential integrity",
  };

  constructor(
    @Inject(DIToken.UserModule.PersonalDataPort)
    private readonly personalData: PersonalDataPort,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const affected = await this.personalData.anonymize(
      UserId.fromString(subjectId),
    );
    return { affected, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.personalData.countResidual(UserId.fromString(subjectId));
  }
}
