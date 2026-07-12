import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { AnnouncementEntity } from "src/hb-backend-api/announcement/domain/model/announcement.entity";
import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";
import { AnnouncementId } from "src/hb-backend-api/announcement/domain/model/vo/announcement-id.vo";
import { AnnouncementMutablePatch } from "src/hb-backend-api/announcement/domain/repositories/announcement.repository";

/** Rehydrates a persisted document into the {@link Announcement} aggregate. */
export function toDomain(doc: AnnouncementEntity): Announcement {
  return Announcement.reconstitute({
    id: AnnouncementId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    authorId: UserId.fromString(String(doc.authorId)),
    title: doc.title,
    body: doc.body,
    pinned: doc.pinned,
    createdAt: doc.createdAt ?? null,
    version: doc.version ?? 0,
  });
}

/** New-notice insert document (version/timestamps default in the schema). */
export function toInsertDoc(
  announcement: Announcement,
): Partial<AnnouncementEntity> {
  return {
    _id: announcement.getId.raw,
    shelterId: announcement.getShelterId.raw,
    authorId: announcement.getAuthorId.raw,
    title: announcement.getTitle,
    body: announcement.getBody,
    pinned: announcement.isPinned,
  };
}

export function toMutablePatch(
  announcement: Announcement,
): AnnouncementMutablePatch {
  return {
    title: announcement.getTitle,
    body: announcement.getBody,
    pinned: announcement.isPinned,
  };
}
