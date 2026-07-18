import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { RetentionRule } from "src/shared/erasure/retention-rule";
import { RefreshTokenRepository } from "src/hb-backend-api/auth/domain/repositories/refresh-token.repository";

/**
 * CREDENTIALS category. Hard-deletes every refresh-token session for the subject
 * — there is no lawful basis to retain a erased member's sessions, and leaving
 * them is a security risk. Runs early so the account is de-authenticated before
 * the rest of the erasure proceeds.
 */
@Injectable()
export class CredentialsDestroyer extends Destroyer {
  public readonly key = "auth.credentials";
  public readonly priority = 10;
  public readonly rule: RetentionRule = {
    category: DataCategory.CREDENTIALS,
    disposition: Disposition.HARD_DELETE,
    legalBasis: "security; no basis to retain an erased subject's sessions",
  };

  constructor(
    @Inject(DIToken.AuthModule.RefreshTokenRepository)
    private readonly refreshTokens: RefreshTokenRepository,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const affected = await this.refreshTokens.deleteByUserId(subjectId);
    return { affected, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.refreshTokens.countByUserId(subjectId);
  }
}
