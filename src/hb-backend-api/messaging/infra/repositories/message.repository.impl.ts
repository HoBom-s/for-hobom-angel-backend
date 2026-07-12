import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { MessageEntity } from "src/hb-backend-api/messaging/domain/model/message.entity";
import { MessageRepository } from "src/hb-backend-api/messaging/domain/repositories/message.repository";

@Injectable()
export class MessageRepositoryImpl implements MessageRepository {
  constructor(
    @InjectModel(MessageEntity.name)
    private readonly model: Model<MessageEntity>,
  ) {}

  public async insert(doc: Partial<MessageEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.create([doc], { session });
  }

  public findBySubject(
    subjectType: MessageSubjectType,
    subjectRef: string,
  ): Promise<MessageEntity[]> {
    return this.model
      .find({ subjectType, subjectRef })
      .sort({ createdAt: 1 })
      .exec();
  }
}
