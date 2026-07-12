import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";
import { AnnouncementPersistencePort } from "src/hb-backend-api/announcement/domain/ports/out/announcement-persistence.port";
import { AnnouncementRepository } from "src/hb-backend-api/announcement/domain/repositories/announcement.repository";
import {
  toInsertDoc,
  toMutablePatch,
} from "src/hb-backend-api/announcement/adapters/out/announcement.mapper";

@Injectable()
export class AnnouncementPersistenceAdapter implements AnnouncementPersistencePort {
  constructor(
    @Inject(DIToken.AnnouncementModule.AnnouncementRepository)
    private readonly announcementRepository: AnnouncementRepository,
  ) {}

  public async create(announcement: Announcement): Promise<Announcement> {
    await this.announcementRepository.insert(toInsertDoc(announcement));
    return announcement;
  }

  public async save(announcement: Announcement): Promise<void> {
    await this.announcementRepository.update(
      announcement.getId.raw,
      announcement.getVersion,
      toMutablePatch(announcement),
    );
  }

  public async remove(announcement: Announcement): Promise<void> {
    await this.announcementRepository.deleteById(announcement.getId.raw);
  }
}
