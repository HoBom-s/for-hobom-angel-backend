import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { parseCursor, toCursorPage } from "src/shared/pagination/keyset";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";
import { VolunteerPostRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post.repository";
import { toDomain } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post.mapper";

@Injectable()
export class VolunteerPostQueryAdapter implements VolunteerPostQueryPort {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostRepository)
    private readonly repository: VolunteerPostRepository,
  ) {}

  public async findById(id: VolunteerPostId): Promise<VolunteerPost | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async findByIds(ids: VolunteerPostId[]): Promise<VolunteerPost[]> {
    const docs = await this.repository.findByIds(ids.map((id) => id.raw));
    return docs.map(toDomain);
  }

  public async findFeed(params: {
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerPost>> {
    const cursorId = parseCursor(params.cursor);

    const docs = await this.repository.listFeed(cursorId, params.limit);

    return toCursorPage(docs, params.limit, toDomain);
  }
}
