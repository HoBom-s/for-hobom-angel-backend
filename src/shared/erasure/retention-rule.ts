import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Disposition } from "src/shared/erasure/disposition.enum";

/**
 * The declarative policy for one data category — disposition + why + how long.
 * Policy lives as data so legal can tune windows without touching logic; a
 * {@link Destroyer} carries its rule and the engine reads it.
 */
export interface RetentionRule {
  readonly category: DataCategory;
  readonly disposition: Disposition;
  /** The lawful reason for the disposition; surfaced in the erasure report. */
  readonly legalBasis: string;
  /** For PURGE_WINDOW / retention sweeps — the window before destruction. */
  readonly retentionDays?: number;
}
