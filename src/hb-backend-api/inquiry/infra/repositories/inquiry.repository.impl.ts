import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { keysetFilter } from "src/shared/pagination/keyset";
import { InquiryEntity } from "src/hb-backend-api/inquiry/domain/model/inquiry.entity";
import { InquiryRepository } from "src/hb-backend-api/inquiry/domain/repositories/inquiry.repository";

@Injectable()
export class InquiryRepositoryImpl implements InquiryRepository {
  constructor(
    @InjectModel(InquiryEntity.name)
    private readonly inquiryModel: Model<InquiryEntity>,
  ) {}

  public async insertInquiry(doc: Partial<InquiryEntity>): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.inquiryModel.create([doc], { session });
  }

  public findInquiryById(id: Types.ObjectId): Promise<InquiryEntity | null> {
    return this.inquiryModel.findById(id).exec();
  }

  public findOneByInquirerAndAnimal(
    inquirerId: Types.ObjectId,
    animalId: Types.ObjectId,
  ): Promise<InquiryEntity | null> {
    return this.inquiryModel.findOne({ inquirerId, animalId }).exec();
  }

  public findPageByInquirer(
    inquirerId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<InquiryEntity[]> {
    return this.inquiryModel
      .find({ inquirerId, ...keysetFilter(cursorId) })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }

  public findPageByShelter(
    shelterId: Types.ObjectId,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<InquiryEntity[]> {
    return this.inquiryModel
      .find({ shelterId, ...keysetFilter(cursorId) })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }
}
