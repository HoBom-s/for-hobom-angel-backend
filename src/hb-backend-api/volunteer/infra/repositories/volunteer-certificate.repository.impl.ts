import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MongoSessionContext } from "src/infra/mongo/transaction/transaction.context";
import { VolunteerCertificateEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate.entity";
import { VolunteerCertificateRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-certificate.repository";

@Injectable()
export class VolunteerCertificateRepositoryImpl implements VolunteerCertificateRepository {
  constructor(
    @InjectModel(VolunteerCertificateEntity.name)
    private readonly model: Model<VolunteerCertificateEntity>,
  ) {}

  public async insert(
    doc: Partial<VolunteerCertificateEntity>,
  ): Promise<VolunteerCertificateEntity> {
    const session = MongoSessionContext.getSession();
    const [created] = await this.model.create([doc], { session });
    return created;
  }

  public findByCertificateNo(
    certificateNo: string,
  ): Promise<VolunteerCertificateEntity | null> {
    return this.model.findOne({ certificateNo }).exec();
  }

  public findByUser(
    userId: Types.ObjectId,
  ): Promise<VolunteerCertificateEntity[]> {
    return this.model.find({ userId }).sort({ _id: -1 }).exec();
  }
}
