import {
  CertificateItem,
  VolunteerCertificate,
} from "src/hb-backend-api/volunteer/domain/model/volunteer-certificate";

const item = (minutes: number): CertificateItem => ({
  eventId: "e1",
  eventTitle: "산책 봉사",
  shelterId: "s1",
  shelterName: "행복 보호소",
  startAt: new Date("2026-06-01T01:00:00Z"),
  endAt: new Date("2026-06-01T04:00:00Z"),
  minutes,
});

describe("VolunteerCertificate", () => {
  it("sums totals across items on issue", () => {
    const cert = VolunteerCertificate.issue({
      certificateNo: "VC-x",
      userId: "u1",
      volunteerNickname: "hong",
      items: [item(180), item(120)],
      now: new Date("2026-07-01"),
    });
    expect(cert.getTotalCount).toBe(2);
    expect(cert.getTotalMinutes).toBe(300);
    expect(cert.getCertificateNo).toBe("VC-x");
    expect(cert.getId).toBeNull();
  });

  it("refuses to issue with no completed participation", () => {
    expect(() =>
      VolunteerCertificate.issue({
        certificateNo: "VC-x",
        userId: "u1",
        volunteerNickname: "hong",
        items: [],
        now: new Date(),
      }),
    ).toThrow("완료된 봉사");
  });
});
