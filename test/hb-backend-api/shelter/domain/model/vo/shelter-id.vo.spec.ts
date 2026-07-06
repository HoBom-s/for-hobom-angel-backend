import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

describe("ShelterId", () => {
  it("round-trips a valid ObjectId string", () => {
    const raw = new Types.ObjectId().toHexString();
    expect(ShelterId.fromString(raw).toString()).toBe(raw);
  });

  it("rejects an invalid id", () => {
    expect(() => ShelterId.fromString("nope")).toThrow();
  });

  it("compares by value", () => {
    const raw = new Types.ObjectId().toHexString();
    expect(ShelterId.fromString(raw).equals(ShelterId.fromString(raw))).toBe(
      true,
    );
  });
});
