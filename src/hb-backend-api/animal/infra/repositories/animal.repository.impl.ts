import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";
import {
  AnimalMutablePatch,
  AnimalRepository,
  AnimalSearchFilter,
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

  public search(
    filter: AnimalSearchFilter,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<AnimalEntity[]> {
    const query: Record<string, unknown> = {};
    if (filter.species) {
      query.species = filter.species;
    }
    if (filter.status) {
      query.status = filter.status;
    }
    if (filter.size) {
      query["traits.size"] = filter.size;
    }
    if (filter.sex) {
      query["traits.sex"] = filter.sex;
    }
    if (filter.keyword) {
      const escaped = filter.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      query.$or = [{ name: rx }, { description: rx }];
    }
    if (cursorId) {
      query._id = { $lt: cursorId };
    }
    // Newest-first by id (ObjectId encodes creation time); fetch one extra to
    // detect whether a further page exists.
    return this.animalModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }
}
