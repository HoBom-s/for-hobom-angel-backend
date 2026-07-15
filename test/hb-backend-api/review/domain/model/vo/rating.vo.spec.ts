import { Rating } from "src/hb-backend-api/review/domain/model/vo/rating.vo";

describe("Rating", () => {
  it.each([1, 2, 3, 4, 5])("accepts %d stars", (n) => {
    expect(Rating.of(n).raw).toBe(n);
  });

  it.each([0, 6, -1, 3.5, Number.NaN])("rejects %s", (n) => {
    expect(() => Rating.of(n)).toThrow("별점");
  });
});
