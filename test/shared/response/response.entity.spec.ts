import { ResponseEntity } from "src/shared/response/response.entity";

describe("ResponseEntity", () => {
  it("wraps items with success flag and timestamp", () => {
    const r = ResponseEntity.ok({ a: 1 }, "done");
    expect(r.success).toBe(true);
    expect(r.items).toEqual({ a: 1 });
    expect(r.message).toBe("done");
    expect(() => new Date(r.timestamp).toISOString()).not.toThrow();
  });

  it("defaults the message to OK", () => {
    expect(ResponseEntity.ok(1).message).toBe("OK");
  });
});
