import { Types } from "mongoose";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";
import { VolunteerCertificateEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate.entity";

export function toDomain(
  doc: VolunteerCertificateEntity,
): VolunteerCertificate {
  return VolunteerCertificate.reconstitute({
    id: String(doc._id),
    certificateNo: doc.certificateNo,
    userId: String(doc.userId),
    volunteerNickname: doc.volunteerNickname,
    issuedAt: doc.issuedAt,
    totalCount: doc.totalCount,
    totalMinutes: doc.totalMinutes,
    items: doc.items.map((i) => ({
      eventId: String(i.eventId),
      eventTitle: i.eventTitle,
      shelterId: String(i.shelterId),
      shelterName: i.shelterName,
      startAt: i.startAt,
      endAt: i.endAt,
      minutes: i.minutes,
    })),
  });
}

export function toInsertDoc(
  certificate: VolunteerCertificate,
): Partial<VolunteerCertificateEntity> {
  return {
    certificateNo: certificate.getCertificateNo,
    userId: new Types.ObjectId(certificate.getUserId),
    volunteerNickname: certificate.getVolunteerNickname,
    issuedAt: certificate.getIssuedAt,
    totalCount: certificate.getTotalCount,
    totalMinutes: certificate.getTotalMinutes,
    items: certificate.getItems.map((i) => ({
      eventId: new Types.ObjectId(i.eventId),
      eventTitle: i.eventTitle,
      shelterId: new Types.ObjectId(i.shelterId),
      shelterName: i.shelterName,
      startAt: i.startAt,
      endAt: i.endAt,
      minutes: i.minutes,
    })),
  };
}
