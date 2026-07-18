import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { RetentionRule } from "src/shared/erasure/retention-rule";
import { ERASED_TEXT } from "src/shared/erasure/tombstone";
import { MessageEntity } from "src/hb-backend-api/messaging/domain/model/message.entity";

/**
 * MESSAGES. Tombstones the body of every message the subject sent, keeping the
 * row so the counterparty's thread stays intact; the sender link resolves to the
 * anonymized user. Heavy (a user can send many messages) → its own transaction.
 * Idempotent.
 */
@Injectable()
export class MessageDestroyer extends Destroyer {
  public readonly key = "messaging.messages";
  public readonly priority = 40;
  public readonly rule: RetentionRule = {
    category: DataCategory.MESSAGES,
    disposition: Disposition.ANONYMIZE,
    legalBasis:
      "conversation integrity kept; the subject's message text purged",
    heavy: true,
  };

  constructor(
    @InjectModel(MessageEntity.name)
    private readonly model: Model<MessageEntity>,
  ) {
    super();
  }

  protected async doErase(subjectId: string): Promise<DisposalResult> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateMany(
      { senderId: new Types.ObjectId(subjectId) },
      { $set: { body: ERASED_TEXT } },
      { session },
    );
    return { affected: result.modifiedCount, retained: 0 };
  }

  public verifyResidual(subjectId: string): Promise<number> {
    return this.model
      .countDocuments({
        senderId: new Types.ObjectId(subjectId),
        body: { $ne: ERASED_TEXT },
      })
      .exec();
  }
}
