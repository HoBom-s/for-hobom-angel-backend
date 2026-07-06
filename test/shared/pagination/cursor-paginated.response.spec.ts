import { CursorPaginatedResponse } from "src/shared/pagination/cursor-paginated.response";

describe("CursorPaginatedResponse", () => {
  it("reports hasNext when a cursor is present", () => {
    const r = CursorPaginatedResponse.of([1, 2], "cursor");
    expect(r.items).toEqual([1, 2]);
    expect(r.nextCursor).toBe("cursor");
    expect(r.hasNext).toBe(true);
  });

  it("reports no next page when cursor is null", () => {
    const r = CursorPaginatedResponse.of([], null);
    expect(r.hasNext).toBe(false);
  });
});
