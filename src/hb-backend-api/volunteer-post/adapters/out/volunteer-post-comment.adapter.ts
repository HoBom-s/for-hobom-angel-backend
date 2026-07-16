import { Inject, Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerPostComment } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment";
import { VolunteerPostCommentId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-comment-id.vo";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { VolunteerPostCommentPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-comment.port";
import { VolunteerPostCommentRepository } from "src/hb-backend-api/volunteer-post/domain/repositories/volunteer-post-comment.repository";
import {
  toDomain,
  toInsertDoc,
} from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-comment.mapper";

@Injectable()
export class VolunteerPostCommentAdapter implements VolunteerPostCommentPort {
  constructor(
    @Inject(DIToken.VolunteerPostModule.VolunteerPostCommentRepository)
    private readonly repository: VolunteerPostCommentRepository,
  ) {}

  public async create(comment: VolunteerPostComment): Promise<void> {
    await this.repository.insert(toInsertDoc(comment));
  }

  public async remove(comment: VolunteerPostComment): Promise<void> {
    await this.repository.deleteById(comment.getId.raw);
  }

  public async findById(
    id: VolunteerPostCommentId,
  ): Promise<VolunteerPostComment | null> {
    const doc = await this.repository.findById(id.raw);
    return doc ? toDomain(doc) : null;
  }

  public async listByPost(params: {
    postId: VolunteerPostId;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerPostComment>> {
    const cursorId =
      params.cursor && Types.ObjectId.isValid(params.cursor)
        ? new Types.ObjectId(params.cursor)
        : null;

    const docs = await this.repository.listByPost(
      params.postId.raw,
      cursorId,
      params.limit,
    );

    const hasNext = docs.length > params.limit;
    const pageDocs = hasNext ? docs.slice(0, params.limit) : docs;
    const last = pageDocs[pageDocs.length - 1];

    return {
      items: pageDocs.map(toDomain),
      hasNext,
      nextCursor: hasNext && last ? String(last._id) : null,
    };
  }
}
