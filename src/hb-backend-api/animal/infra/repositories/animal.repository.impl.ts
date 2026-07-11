import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import {
  AnimalMutablePatch,
  AnimalRepository,
} from "src/hb-backend-api/animal/domain/repositories/animal.repository";

@Injectable()
export class AnimalRepositoryImpl implements AnimalRepository {
  constructor(
    @InjectModel(AnimalEntity.name)
    private readonly animalModel: Model<AnimalEntity>,
  ) {}

  public async insert(doc: Partial<AnimalEntity>): Promise<AnimalEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.animalModel.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: AnimalMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.animalModel.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("동물 정보");
    }
  }

  public findById(id: Types.ObjectId): Promise<AnimalEntity | null> {
    return this.animalModel.findById(id).exec();
  }

  public findByShelterId(shelterId: Types.ObjectId): Promise<AnimalEntity[]> {
    return this.animalModel.find({ shelterId }).sort({ createdAt: -1 }).exec();
  }
}
