import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { OptimisticLockException } from "src/shared/exception/optimistic-lock.exception";
import { AddressVisibility } from "src/hb-backend-api/shelter/domain/enums/address-visibility.enum";
import { ShelterStatus } from "src/hb-backend-api/shelter/domain/enums/shelter-status.enum";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";
import {
  ShelterMutablePatch,
  ShelterRepository,
} from "src/hb-backend-api/shelter/domain/repositories/shelter.repository";

@Injectable()
export class ShelterRepositoryImpl implements ShelterRepository {
  constructor(
    @InjectModel(ShelterEntity.name)
    private readonly shelterModel: Model<ShelterEntity>,
  ) {}

  public async insert(doc: Partial<ShelterEntity>): Promise<ShelterEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.shelterModel.create([doc], { session });
    return created;
  }

  public async update(
    id: Types.ObjectId,
    expectedVersion: number,
    patch: ShelterMutablePatch,
  ): Promise<void> {
    const session = MongoSessionContext.getSession();
    const result = await this.shelterModel.updateOne(
      { _id: id, version: expectedVersion },
      { $set: patch, $inc: { version: 1 } },
      { session },
    );
    if (result.matchedCount === 0) {
      throw new OptimisticLockException("보호소 정보");
    }
  }

  public findById(id: Types.ObjectId): Promise<ShelterEntity | null> {
    return this.shelterModel.findById(id).exec();
  }

  public findBySlug(slug: string): Promise<ShelterEntity | null> {
    return this.shelterModel.findOne({ slug }).exec();
  }

  public findMappable(region?: string): Promise<ShelterEntity[]> {
    const query: Record<string, unknown> = {
      status: ShelterStatus.VERIFIED,
      "address.visibility": { $ne: AddressVisibility.HIDDEN },
      "address.lat": { $ne: null },
      "address.lng": { $ne: null },
    };
    if (region) {
      query["address.region"] = region;
    }
    return this.shelterModel.find(query).exec();
  }

  public listVerified(
    region: string | undefined,
    cursorId: Types.ObjectId | null,
    limit: number,
  ): Promise<ShelterEntity[]> {
    const query: Record<string, unknown> = {
      status: ShelterStatus.VERIFIED,
    };
    if (region) {
      query["address.region"] = region;
    }
    if (cursorId) {
      query._id = { $lt: cursorId };
    }
    return this.shelterModel
      .find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .exec();
  }
}
