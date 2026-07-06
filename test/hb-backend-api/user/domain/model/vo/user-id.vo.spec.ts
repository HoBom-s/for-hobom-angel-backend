import { Types } from "mongoose";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";

describe("UserId", () => {
  it("round-trips a valid ObjectId string", () => {
    const raw = new Types.ObjectId().toHexString();
    expect(UserId.fromString(raw).toString()).toBe(raw);
  });

  it("generates a fresh id", () => {
    expect(UserId.generate().equals(UserId.generate())).toBe(false);
  });

  it("rejects an invalid id", () => {
    expect(() => UserId.fromString("not-an-object-id")).toThrow();
  });

  it("compares by value", () => {
    const raw = new Types.ObjectId().toHexString();
    expect(UserId.fromString(raw).equals(UserId.fromString(raw))).toBe(true);
  });
});
