import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerEventRepository } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-event.repository";
import { toDomain } from "src/hb-backend-api/volunteer/adapters/out/volunteer-event.mapper";

@Injectable()
export class VolunteerEventQueryAdapter implements VolunteerEventQueryPort {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerEventRepository)
    private readonly repository: VolunteerEventRepository,
  ) {}

  public async findById(id: VolunteerEventId): Promise<VolunteerEvent | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByIds(ids: VolunteerEventId[]): Promise<VolunteerEvent[]> {
    const docs = await this.repository.findByIds(ids.map((id) => id.raw));
    return docs.map(toDomain);
  }

  public async findByShelter(
    shelterId: ShelterId,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page<VolunteerEvent>> {
    const cursorId =
      cursor && Types.ObjectId.isValid(cursor)
        ? new Types.ObjectId(cursor)
        : null;
    const docs = await this.repository.findByShelterId(
      shelterId.raw,
      cursorId,
      limit,
    );
    const hasNext = docs.length > limit;
    const pageDocs = hasNext ? docs.slice(0, limit) : docs;
    const last = pageDocs[pageDocs.length - 1];
    return {
      items: pageDocs.map(toDomain),
      hasNext,
      nextCursor: hasNext && last ? String(last._id) : null,
    };
  }

  public async findUpcoming(
    now: Date,
    limit: number,
  ): Promise<VolunteerEvent[]> {
    const docs = await this.repository.findUpcoming(now, limit);
    return docs.map(toDomain);
  }

  public async findExpiredOpen(
    now: Date,
    limit: number,
  ): Promise<VolunteerEvent[]> {
    const docs = await this.repository.findExpiredOpen(now, limit);
    return docs.map(toDomain);
  }
}
