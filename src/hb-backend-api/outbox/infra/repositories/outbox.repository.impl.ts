import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { OutboxRepository } from "src/hb-backend-api/outbox/domain/repositories/outbox.repository";

@Injectable()
export class OutboxRepositoryImpl implements OutboxRepository {
  constructor(
    @InjectModel(OutboxEntity.name)
    private readonly outboxModel: Model<OutboxEntity>,
  ) {}

  public async save(entity: CreateOutboxEntity): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.outboxModel.create(
      [
        {
          eventType: entity.eventType,
          payload: entity.payload,
          status: entity.status,
          retryCount: entity.retryCount,
          version: entity.version,
        },
      ],
      { session },
    );
  }
}
