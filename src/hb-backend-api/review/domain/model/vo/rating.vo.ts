/** A 1–5 star rating. Whole stars only; anything else is rejected at construction. */
export class Rating {
  public static readonly MIN = 1;
  public static readonly MAX = 5;

  private constructor(private readonly value: number) {
    Object.freeze(this);
  }

  public static of(value: number): Rating {
    if (!Number.isInteger(value) || value < Rating.MIN || value > Rating.MAX) {
      throw new Error("별점은 1점부터 5점까지의 정수여야 해요.");
    }
    return new Rating(value);
  }

  public get raw(): number {
    return this.value;
  }
}
