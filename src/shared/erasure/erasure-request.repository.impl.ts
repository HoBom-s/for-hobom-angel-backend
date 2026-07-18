import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { ErasureRequestEntity } from "src/shared/erasure/erasure-request.entity";
import { ErasureRequestStatus } from "src/shared/erasure/erasure-request-status.enum";
import { ErasureTaskStatus } from "src/shared/erasure/erasure-task-status.enum";
import {
  CreateErasureRequest,
  ErasureRequestRepository,
  TaskOutcome,
} from "src/shared/erasure/erasure-request.repository";

@Injectable()
export class ErasureRequestRepositoryImpl implements ErasureRequestRepository {
  constructor(
    @InjectModel(ErasureRequestEntity.name)
    private readonly model: Model<ErasureRequestEntity>,
  ) {}

  public async create(
    doc: CreateErasureRequest,
  ): Promise<ErasureRequestEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create(
      [
        {
          subjectId: doc.subjectId,
          actorId: doc.actorId,
          reason: doc.reason,
          status: doc.status,
          quarantineUntil: doc.quarantineUntil,
          tasks: doc.tasks.map((t) => ({
            key: t.key,
            category: t.category,
            disposition: t.disposition,
            priority: t.priority,
            status: ErasureTaskStatus.PENDING,
            affected: 0,
            retained: 0,
            attempts: 0,
          })),
        },
      ],
      { session },
    );
    return created;
  }

  public findById(id: Types.ObjectId): Promise<ErasureRequestEntity | null> {
    return this.model.findById(id).exec();
  }

  public findBySubject(
    subjectId: Types.ObjectId,
  ): Promise<ErasureRequestEntity[]> {
    return this.model.find({ subjectId }).sort({ _id: -1 }).exec();
  }

  public async markInProgress(id: Types.ObjectId): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateOne(
      { _id: id },
      { $set: { status: ErasureRequestStatus.IN_PROGRESS } },
      { session },
    );
  }

  public async recordTask(
    id: Types.ObjectId,
    key: string,
    outcome: TaskOutcome,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateOne(
      { _id: id },
      {
        $set: {
          "tasks.$[t].status": outcome.status,
          "tasks.$[t].affected": outcome.affected,
          "tasks.$[t].retained": outcome.retained,
          "tasks.$[t].note": outcome.note ?? null,
          "tasks.$[t].lastError": outcome.lastError ?? null,
        },
        $inc: { "tasks.$[t].attempts": 1 },
      },
      { arrayFilters: [{ "t.key": key }], session },
    );
  }

  public async finalize(
    id: Types.ObjectId,
    status: ErasureRequestStatus,
    completedAt: Date | null,
    lastError: string | null,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateOne(
      { _id: id },
      { $set: { status, completedAt, lastError } },
      { session },
    );
  }
}
