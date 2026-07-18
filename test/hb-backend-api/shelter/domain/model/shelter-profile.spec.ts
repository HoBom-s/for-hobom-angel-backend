import { ShelterProfile } from "src/hb-backend-api/shelter/domain/model/shelter-profile";

describe("ShelterProfile", () => {
  it("empty() has all null fields", () => {
    const p = ShelterProfile.empty();
    expect(p.getIntro).toBeNull();
    expect(p.getOperatingSince).toBeNull();
    expect(p.getRepresentativeName).toBeNull();
    expect(p.getVisitGuide).toBeNull();
    expect(p.getSupportGuide).toBeNull();
  });

  it("of() trims text and normalizes blanks to null", () => {
    const since = new Date("2015-03-01T00:00:00.000Z");
    const p = ShelterProfile.of({
      intro: "  안녕하세요  ",
      operatingSince: since,
      representativeName: "  ",
      visitGuide: "평일 10~17시",
    });
    expect(p.getIntro).toBe("안녕하세요");
    expect(p.getOperatingSince).toBe(since);
    expect(p.getRepresentativeName).toBeNull();
    expect(p.getVisitGuide).toBe("평일 10~17시");
    expect(p.getSupportGuide).toBeNull();
  });
});
