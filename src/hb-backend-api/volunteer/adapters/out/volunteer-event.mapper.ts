import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerEventMutablePatch } from "src/hb-backend-api/volunteer/domain/repositories/volunteer-event.repository";

export function toDomain(doc: VolunteerEventEntity): VolunteerEvent {
  return VolunteerEvent.reconstitute({
    id: VolunteerEventId.fromString(String(doc._id)),
    shelterId: ShelterId.fromString(String(doc.shelterId)),
    title: doc.title,
    description: doc.description ?? "",
    startAt: doc.startAt,
    endAt: doc.endAt,
    capacity: doc.capacity,
    signedUpCount: doc.signedUpCount ?? 0,
    status: doc.status,
    version: doc.version ?? 0,
  });
}

export function toInsertDoc(
  event: VolunteerEvent,
): Partial<VolunteerEventEntity> {
  return {
    _id: event.getId.raw,
    shelterId: event.getShelterId.raw,
    title: event.getTitle,
    description: event.getDescription,
    startAt: event.getStartAt,
    endAt: event.getEndAt,
    capacity: event.getCapacity,
    signedUpCount: event.getSignedUpCount,
    status: event.getStatus,
    version: event.getVersion,
  };
}

export function toMutablePatch(
  event: VolunteerEvent,
): VolunteerEventMutablePatch {
  return {
    title: event.getTitle,
    description: event.getDescription,
    signedUpCount: event.getSignedUpCount,
    status: event.getStatus,
  };
}
