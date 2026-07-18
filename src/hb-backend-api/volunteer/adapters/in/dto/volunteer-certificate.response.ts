import { ApiProperty } from "@nestjs/swagger";
import { VolunteerCertificate } from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";

class CertificateItemResponse {
  @ApiProperty()
  public eventTitle: string;

  @ApiProperty()
  public shelterName: string;

  @ApiProperty({ type: Date })
  public startAt: Date;

  @ApiProperty({ type: Date })
  public endAt: Date;

  @ApiProperty()
  public minutes: number;
}

/** An issued volunteer-service certificate (봉사활동 확인서). */
export class VolunteerCertificateResponse {
  @ApiProperty()
  public certificateNo: string;

  @ApiProperty()
  public volunteerNickname: string;

  @ApiProperty({ type: Date })
  public issuedAt: Date;

  @ApiProperty()
  public totalCount: number;

  @ApiProperty()
  public totalMinutes: number;

  @ApiProperty({ description: "총 봉사 시간 (시간 단위, 소수점 1자리)" })
  public totalHours: number;

  @ApiProperty({ type: [CertificateItemResponse] })
  public items: CertificateItemResponse[];

  public static from(
    certificate: VolunteerCertificate,
  ): VolunteerCertificateResponse {
    const response = new VolunteerCertificateResponse();
    response.certificateNo = certificate.getCertificateNo;
    response.volunteerNickname = certificate.getVolunteerNickname;
    response.issuedAt = certificate.getIssuedAt;
    response.totalCount = certificate.getTotalCount;
    response.totalMinutes = certificate.getTotalMinutes;
    response.totalHours =
      Math.round((certificate.getTotalMinutes / 60) * 10) / 10;
    response.items = certificate.getItems.map((item) => ({
      eventTitle: item.eventTitle,
      shelterName: item.shelterName,
      startAt: item.startAt,
      endAt: item.endAt,
      minutes: item.minutes,
    }));
    return response;
  }
}
