import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { EventType } from "src/hb-backend-api/outbox/domain/enums/event-type.enum";
import { OutboxStatus } from "src/hb-backend-api/outbox/domain/enums/outbox-status.enum";
import { CreateOutboxEntity } from "src/hb-backend-api/outbox/domain/model/create-outbox.entity";
import { OutboxEntity } from "src/hb-backend-api/outbox/domain/model/outbox.entity";
import { OutboxView } from "src/hb-backend-api/outbox/domain/ports/out/outbox-query.port";
import { OutboxRepository } from "src/hb-backend-api/outbox/domain/repositories/outbox.repository";

/** Upper bound on a single relay poll response, oldest-first. */
const POLL_BATCH_LIMIT = 200;

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

  public async findByEventTypeAndStatus(
    eventType: EventType,
    status: OutboxStatus,
  ): Promise<OutboxView[]> {
    const docs = await this.outboxModel
      .find({ eventType, status })
      .sort({ createdAt: 1 })
      .limit(POLL_BATCH_LIMIT)
      .lean()
      .exec();

    return docs.map((doc) => ({
      id: String(doc._id),
      eventId: doc.eventId,
      eventType: doc.eventType,
      payload: doc.payload ?? {},
      status: doc.status,
      retryCount: doc.retryCount,
      sentAt: doc.sentAt ?? null,
      failedAt: doc.failedAt ?? null,
      lastError: doc.lastError ?? null,
      version: doc.version,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }

  public async markAsSent(eventId: string): Promise<boolean> {
    // Only PENDING/FAILED rows advance to SENT — re-marking a SENT row is a
    // harmless no-op (idempotent redelivery), never a backwards transition.
    const result = await this.outboxModel.updateOne(
      { eventId, status: { $in: [OutboxStatus.PENDING, OutboxStatus.FAILED] } },
      {
        $set: {
          status: OutboxStatus.SENT,
          sentAt: new Date(),
          lastError: null,
        },
        $inc: { version: 1 },
      },
    );
    return result.matchedCount > 0;
  }

  public async markAsFailed(
    eventId: string,
    errorMessage: string,
  ): Promise<boolean> {
    // A SENT row is terminal and never flips to FAILED; PENDING/FAILED bump
    // retryCount so the relay can retry.
    const result = await this.outboxModel.updateOne(
      { eventId, status: { $in: [OutboxStatus.PENDING, OutboxStatus.FAILED] } },
      {
        $set: {
          status: OutboxStatus.FAILED,
          failedAt: new Date(),
          lastError: errorMessage,
        },
        $inc: { retryCount: 1, version: 1 },
      },
    );
    return result.matchedCount > 0;
  }
}
