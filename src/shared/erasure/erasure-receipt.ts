import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Disposition } from "src/shared/erasure/disposition.enum";

/**
 * The proof line for one category: what disposition ran, how many rows it
 * affected, and how many were deliberately retained under a legal basis.
 */
export class ErasureReceipt {
  private constructor(
    public readonly category: DataCategory,
    public readonly disposition: Disposition,
    public readonly affected: number,
    public readonly retained: number,
    public readonly note: string | null,
  ) {}

  public static of(params: {
    category: DataCategory;
    disposition: Disposition;
    affected: number;
    retained: number;
    note?: string | null;
  }): ErasureReceipt {
    return new ErasureReceipt(
      params.category,
      params.disposition,
      params.affected,
      params.retained,
      params.note ?? null,
    );
  }
}
