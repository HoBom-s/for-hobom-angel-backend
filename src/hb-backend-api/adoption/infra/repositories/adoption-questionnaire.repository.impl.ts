import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { AdoptionQuestionnaireEntity } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire.entity";
import {
  AdoptionQuestionnaireRepository,
  QuestionnaireMutablePatch,
} from "src/hb-backend-api/adoption/domain/repositories/adoption-questionnaire.repository";

@Injectable()
export class AdoptionQuestionnaireRepositoryImpl implements AdoptionQuestionnaireRepository {
  constructor(
    @InjectModel(AdoptionQuestionnaireEntity.name)
    private readonly model: Model<AdoptionQuestionnaireEntity>,
  ) {}

  public async insert(
    doc: Partial<AdoptionQuestionnaireEntity>,
  ): Promise<void> {
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
      throw new OptimisticLockException("입양 설문");
    }
  }

  public findByShelterId(
    shelterId: Types.ObjectId,
  ): Promise<AdoptionQuestionnaireEntity | null> {
    return this.model.findOne({ shelterId }).exec();
  }
}
