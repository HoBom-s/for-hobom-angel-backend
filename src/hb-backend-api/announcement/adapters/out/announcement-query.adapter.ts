import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";
import { AnnouncementId } from "src/hb-backend-api/announcement/domain/model/vo/announcement-id.vo";
import { AnnouncementQueryPort } from "src/hb-backend-api/announcement/domain/ports/out/announcement-query.port";
import { AnnouncementRepository } from "src/hb-backend-api/announcement/domain/repositories/announcement.repository";
import { toDomain } from "src/hb-backend-api/announcement/adapters/out/announcement.mapper";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

@Injectable()
export class AnnouncementQueryAdapter implements AnnouncementQueryPort {
  constructor(
    @Inject(DIToken.AnnouncementModule.AnnouncementRepository)
    private readonly announcementRepository: AnnouncementRepository,
  ) {}

  public async findById(id: AnnouncementId): Promise<Announcement | null> {
    const doc = await this.announcementRepository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByShelter(
    shelterId: ShelterId,
    limit: number,
  ): Promise<Announcement[]> {
    const docs = await this.announcementRepository.findByShelter(
      shelterId.raw,
      limit,
    );
    return docs.map(toDomain);
  }
}
