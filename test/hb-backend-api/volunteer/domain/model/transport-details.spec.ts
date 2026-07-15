import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { TransportDetails } from "src/hb-backend-api/volunteer/domain/model/vo/transport-details";

const FLIGHT = new Date("2027-01-01T09:00:00.000Z");

const build = (over: Partial<Parameters<typeof TransportDetails.of>[0]> = {}) =>
  TransportDetails.of({
    departure: "인천",
    arrival: "밴쿠버",
    flightAt: FLIGHT,
    animalIds: [AnimalId.generate()],
    ...over,
  });

describe("TransportDetails", () => {
  it("trims strings and derives the animal count", () => {
    const t = build({
      departure: "  인천  ",
      animalIds: [AnimalId.generate(), AnimalId.generate()],
      qualification: "  경험자  ",
    });
    expect(t.getDeparture).toBe("인천");
    expect(t.getAnimalCount).toBe(2);
    expect(t.getQualification).toBe("경험자");
  });

  it("treats a blank qualification as null", () => {
    expect(build({ qualification: "   " }).getQualification).toBeNull();
    expect(build().getQualification).toBeNull();
  });

  it("allows an empty animal list", () => {
    expect(build({ animalIds: [] }).getAnimalCount).toBe(0);
  });

  it("rejects a missing departure/arrival and a bad flight time", () => {
    expect(() => build({ departure: "  " })).toThrow("출발지");
    expect(() => build({ arrival: "" })).toThrow("도착지");
    expect(() => build({ flightAt: new Date("nope") })).toThrow("항공편");
  });

  it("is immutable", () => {
    expect(Object.isFrozen(build())).toBe(true);
  });
});
