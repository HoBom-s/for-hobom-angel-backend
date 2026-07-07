import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { IdempotencyPort } from "src/hb-backend-api/idempotency/domain/ports/out/idempotency.port";
import { IdempotencyRepository } from "src/hb-backend-api/idempotency/domain/repositories/idempotency.repository";

@Injectable()
export class IdempotencyAdapter implements IdempotencyPort {
  constructor(
    @Inject(DIToken.IdempotencyModule.IdempotencyRepository)
    private readonly idempotencyRepository: IdempotencyRepository,
  ) {}

  public reserve(scope: string, key: string): Promise<void> {
    return this.idempotencyRepository.reserve(scope, key);
  }
}
