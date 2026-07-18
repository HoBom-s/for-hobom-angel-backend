import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { RefreshTokenStatus } from "src/hb-backend-api/auth/domain/enums/refresh-token-status.enum";
import { RefreshTokenEntity } from "src/hb-backend-api/auth/domain/model/refresh-token.entity";
import {
  CreateRefreshToken,
  RefreshTokenRepository,
  StoredRefreshToken,
} from "src/hb-backend-api/auth/domain/repositories/refresh-token.repository";

@Injectable()
export class RefreshTokenRepositoryImpl implements RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenEntity.name)
    private readonly model: Model<RefreshTokenEntity>,
  ) {}

  public async create(token: CreateRefreshToken): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.create(
      [
        {
          jti: token.jti,
          familyId: token.familyId,
          userId: token.userId,
          status: RefreshTokenStatus.ACTIVE,
          expiresAt: token.expiresAt,
        },
      ],
      { session },
    );
  }

  public async findByJti(jti: string): Promise<StoredRefreshToken | null> {
    const doc = await this.model.findOne({ jti }).lean().exec();
    if (!doc) {
      return null;
    }
    return StoredRefreshToken.of({
      jti: doc.jti,
      familyId: doc.familyId,
      userId: doc.userId,
      status: doc.status,
    });
  }

  public async markRotated(jti: string): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateOne(
      { jti },
      { $set: { status: RefreshTokenStatus.ROTATED } },
      { session },
    );
  }

  public async revokeFamily(familyId: string): Promise<void> {
    const session = MongoSessionContext.getSession();
    await this.model.updateMany(
      { familyId },
      { $set: { status: RefreshTokenStatus.REVOKED } },
      { session },
    );
  }

  public async deleteByUserId(userId: string): Promise<number> {
    const session = MongoSessionContext.getSession();
    const result = await this.model.deleteMany({ userId }, { session });
    return result.deletedCount ?? 0;
  }

  public countByUserId(userId: string): Promise<number> {
    return this.model.countDocuments({ userId }).exec();
  }
}
