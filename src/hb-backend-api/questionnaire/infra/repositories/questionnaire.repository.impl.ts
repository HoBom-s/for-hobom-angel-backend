import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";
import { QuestionnaireEntity } from "src/hb-backend-api/questionnaire/domain/model/questionnaire.entity";
import {
  QuestionnaireMutablePatch,
  QuestionnaireRepository,
} from "src/hb-backend-api/questionnaire/domain/repositories/questionnaire.repository";

@Injectable()
export class QuestionnaireRepositoryImpl implements QuestionnaireRepository {
  constructor(
    @InjectModel(QuestionnaireEntity.name)
    private readonly model: Model<QuestionnaireEntity>,
  ) {}

  public async insert(doc: Partial<QuestionnaireEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.create([doc], { session });
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: QuestionnaireMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("설문");
    }
  }

  public findByShelterAndPurpose(
    shelterId: Types.ObjectId,
    purpose: QuestionnairePurpose,
  ): Promise<QuestionnaireEntity | null> {
    return this.model.findOne({ shelterId, purpose }).exec();
  }
}
