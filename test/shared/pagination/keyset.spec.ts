import { Types } from "mongoose";
import {
  keysetFilter,
  parseCursor,
  toCursorPage,
} from "src/shared/pagination/keyset";

describe("keyset pagination helpers", () => {
  describe("parseCursor", () => {
    it("returns an ObjectId for a valid cursor", () => {
      const raw = new Types.ObjectId().toHexString();
      expect(parseCursor(raw)?.toHexString()).toBe(raw);
    });

    it("returns null for null, undefined, or malformed cursors", () => {
      expect(parseCursor(null)).toBeNull();
      expect(parseCursor(undefined)).toBeNull();
      expect(parseCursor("not-an-object-id")).toBeNull();
    });
  });

  describe("keysetFilter", () => {
    it("is empty on the first page", () => {
      expect(keysetFilter(null)).toEqual({});
    });

    it("filters _id below the cursor when present", () => {
      const id = new Types.ObjectId();
      expect(keysetFilter(id)).toEqual({ _id: { $lt: id } });
    });
  });

  describe("toCursorPage", () => {
    const doc = (id: string, v: string) => ({ _id: id, v });

    it("keeps limit items, flags hasNext, and sets nextCursor to the last kept id", () => {
      const docs = [doc("a", "1"), doc("b", "2"), doc("c", "3")];
      const page = toCursorPage(docs, 2, (d) => d.v);
      expect(page.items).toEqual(["1", "2"]);
      expect(page.hasNext).toBe(true);
      expect(page.nextCursor).toBe("b");
    });

    it("has no next page when the result does not exceed the limit", () => {
      const docs = [doc("a", "1"), doc("b", "2")];
      const page = toCursorPage(docs, 2, (d) => d.v);
      expect(page.items).toEqual(["1", "2"]);
      expect(page.hasNext).toBe(false);
      expect(page.nextCursor).toBeNull();
    });

    it("handles an empty result", () => {
      const page = toCursorPage(
        [] as { _id: string; v: string }[],
        20,
        (d) => d.v,
      );
      expect(page).toEqual({ items: [], hasNext: false, nextCursor: null });
    });
  });
});
