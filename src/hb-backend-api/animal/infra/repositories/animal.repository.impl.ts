import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { AnimalSort } from "src/hb-backend-api/animal/domain/enums/animal-sort.enum";
import { AnimalStatus } from "src/hb-backend-api/animal/domain/enums/animal-status.enum";
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

  public countByShelterAndStatuses(
    shelterId: Types.ObjectId,
    statuses: AnimalStatus[],
  ): Promise<number> {
    return this.animalModel
      .countDocuments({ shelterId, status: { $in: statuses } })
      .exec();
  }

  public countByStatuses(statuses: AnimalStatus[]): Promise<number> {
    return this.animalModel
      .countDocuments({ status: { $in: statuses } })
      .exec();
  }

  public search(
    filter: AnimalSearchFilter,
    cursorId: Types.ObjectId | null,
    limit: number,
    sort: AnimalSort,
  ): Promise<AnimalEntity[]> {
    // Blinded (operator-hidden) listings never surface in public discovery.
    const query: Record<string, unknown> = { blinded: { $ne: true } };
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
    // Keyset by id: OLDEST walks ascending (_id > cursor), LATEST descending.
    const ascending = sort === AnimalSort.OLDEST;
    if (cursorId) {
      query._id = ascending ? { $gt: cursorId } : { $lt: cursorId };
    }
    // Fetch one extra to detect whether a further page exists.
    return this.animalModel
      .find(query)
      .sort({ _id: ascending ? 1 : -1 })
      .limit(limit + 1)
      .exec();
  }
}
