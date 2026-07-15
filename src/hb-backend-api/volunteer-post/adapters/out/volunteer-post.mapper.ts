import { Types } from "mongoose";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";

export function toDomain(doc: VolunteerPostEntity): VolunteerPost {
  return VolunteerPost.reconstitute({
    id: VolunteerPostId.fromString(String(doc._id)),
    authorId: UserId.fromString(String(doc.authorId)),
    eventId: doc.eventId ? String(doc.eventId) : null,
    body: doc.body,
    imageKeys: doc.imageKeys ?? [],
    likeCount: doc.likeCount ?? 0,
    createdAt: doc.createdAt ?? null,
    version: doc.version ?? 0,
  });
}

export function toInsertDoc(post: VolunteerPost): Partial<VolunteerPostEntity> {
  const eventId = post.getEventId;
  return {
    _id: post.getId.raw,
    authorId: post.getAuthorId.raw,
    eventId: eventId ? new Types.ObjectId(eventId) : null,
    body: post.getBody,
    imageKeys: post.getImageKeys,
  };
}
