import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { VolunteerType } from "src/hb-backend-api/volunteer/domain/enums/volunteer-type.enum";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import {
  TransportDoc,
  VolunteerEventEntity,
} from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { TransportDetails } from "src/hb-backend-api/volunteer/domain/model/vo/transport-details";
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
    type: doc.type ?? VolunteerType.GENERAL,
    transport: toTransportDomain(doc.transport),
    version: doc.version ?? 0,
  });
}

function toTransportDomain(
  transport: TransportDoc | null | undefined,
): TransportDetails | null {
  if (!transport) {
    return null;
  }
  return TransportDetails.of({
    departure: transport.departure,
    arrival: transport.arrival,
    flightAt: transport.flightAt,
    animalIds: (transport.animalIds ?? []).map((id) =>
      AnimalId.fromString(String(id)),
    ),
    qualification: transport.qualification ?? null,
  });
}

function toTransportDoc(
  transport: TransportDetails | null,
): TransportDoc | null {
  if (!transport) {
    return null;
  }
  return {
    departure: transport.getDeparture,
    arrival: transport.getArrival,
    flightAt: transport.getFlightAt,
    animalIds: transport.getAnimalIds.map((id) => id.raw),
    qualification: transport.getQualification,
  };
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
    type: event.getType,
    transport: toTransportDoc(event.getTransport),
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
