import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import {
  PostBlockDoc,
  VolunteerPostEntity,
} from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import { PostContent } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-content";
import { PostBlockType } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";

export function toDomain(doc: VolunteerPostEntity): VolunteerPost {
  return VolunteerPost.reconstitute({
    id: VolunteerPostId.fromString(String(doc._id)),
    authorId: UserId.fromString(String(doc.authorId)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    eventId: doc.eventId ? String(doc.eventId) : null,
    content: PostContent.of(
      (doc.content ?? []).map((block) => ({
        type: block.type,
        text: block.text ?? undefined,
        imageKey: block.imageKey ?? undefined,
        caption: block.caption ?? undefined,
      })),
    ),
    likeCount: doc.likeCount ?? 0,
    commentCount: doc.commentCount ?? 0,
    createdAt: doc.createdAt ?? null,
    version: doc.version ?? 0,
  });
}

export function toInsertDoc(post: VolunteerPost): Partial<VolunteerPostEntity> {
  const eventId = post.getEventId;
  return {
    _id: post.getId.raw,
    authorId: post.getAuthorId.raw,
    shelterId: post.getShelterId.raw,
    eventId: eventId ? new Types.ObjectId(eventId) : null,
    content: post.getContent.getBlocks.map((block): PostBlockDoc =>
      block.type === PostBlockType.IMAGE
        ? {
            type: PostBlockType.IMAGE,
            imageKey: block.imageKey,
            caption: block.caption,
          }
        : { type: PostBlockType.TEXT, text: block.text },
    ),
  };
}
