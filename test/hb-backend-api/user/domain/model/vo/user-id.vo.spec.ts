import { Types } from "mongoose";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { InvalidInputError } from "src/shared/exception/domain-exception";

describe("UserId", () => {
  it("round-trips a valid ObjectId string", () => {
    const raw = new Types.ObjectId().toHexString();
    expect(UserId.fromString(raw).toString()).toBe(raw);
  });

  it("generates a fresh id", () => {
    expect(UserId.generate().equals(UserId.generate())).toBe(false);
  });

  it("rejects an invalid id as InvalidInputError (→ 400) with a labeled message", () => {
    expect(() => UserId.fromString("not-an-object-id")).toThrow(
      InvalidInputError,
    );
    expect(() => UserId.fromString("not-an-object-id")).toThrow(
      "올바르지 않은 User ID 형식이에요.",
    );
  });

  it("compares by value", () => {
    const raw = new Types.ObjectId().toHexString();
    expect(UserId.fromString(raw).equals(UserId.fromString(raw))).toBe(true);
  });
});
