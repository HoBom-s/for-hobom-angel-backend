import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { IdempotencyConflictException } from "src/hb-backend-api/idempotency/domain/exception/idempotency-conflict.exception";
import { IdempotencyKeyEntity } from "src/hb-backend-api/idempotency/domain/model/idempotency-key.entity";
import { IdempotencyRepository } from "src/hb-backend-api/idempotency/domain/repositories/idempotency.repository";

const MONGO_DUPLICATE_KEY = 11000;

@Injectable()
export class IdempotencyRepositoryImpl implements IdempotencyRepository {
  constructor(
    @InjectModel(IdempotencyKeyEntity.name)
    private readonly model: Model<IdempotencyKeyEntity>,
  ) {}

  public async reserve(scope: string, key: string): Promise<void> {
    const session = MongoSessionContext.getSession();
    try {
      await this.model.create([{ scope, key }], { session });
    } catch (error) {
      if ((error as { code?: number }).code === MONGO_DUPLICATE_KEY) {
        throw new IdempotencyConflictException(scope, key);
      }
      throw error;
    }
  }
}
