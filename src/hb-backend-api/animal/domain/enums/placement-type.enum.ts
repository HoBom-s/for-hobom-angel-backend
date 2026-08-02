/**
 * The kinds of placement an animal is offered for — the application types it
 * accepts. An AVAILABLE animal declares at least one; the catalog filters and
 * the application guards read it. Values intentionally match the approval
 * engine's ADOPTION/FOSTER strings, but this enum is owned by the animal domain
 * so the aggregate stays decoupled from the approval engine.
 */
export enum PlacementType {
  /** 입양 — permanent adoption. */
  ADOPTION = "ADOPTION",
  /** 임시보호 — temporary foster care. */
  FOSTER = "FOSTER",
}
