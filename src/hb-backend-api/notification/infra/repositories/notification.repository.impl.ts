import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { NotificationEntity } from "src/hb-backend-api/notification/domain/model/notification.entity";
import { NotificationRepository } from "src/hb-backend-api/notification/domain/repositories/notification.repository";

@Injectable()
export class NotificationRepositoryImpl implements NotificationRepository {
  constructor(
    @InjectModel(NotificationEntity.name)
    private readonly notificationModel: Model<NotificationEntity>,
  ) {}

  public async insert(doc: Partial<NotificationEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.notificationModel.create([doc], { session });
  }

  public findById(id: Types.ObjectId): Promise<NotificationEntity | null> {
    return this.notificationModel.findById(id).exec();
  }

  public findPageByRecipient(
    recipientId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<NotificationEntity[]> {
    return this.notificationModel
      .find({ recipientId, ...(cursorId && { _id: { $lt: cursorId } }) })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }

  public countUnread(recipientId: Types.ObjectId): Promise<number> {
    return this.notificationModel
      .countDocuments({ recipientId, readAt: null })
      .exec();
  }

  public async markRead(id: Types.ObjectId, readAt: Date): Promise<void> {
    await this.notificationModel
      .updateOne({ _id: id, readAt: null }, { $set: { readAt } })
      .exec();
  }

  public async markAllRead(
    recipientId: Types.ObjectId,
    readAt: Date,
  ): Promise<void> {
    await this.notificationModel
      .updateMany({ recipientId, readAt: null }, { $set: { readAt } })
      .exec();
  }
}
