/**
 * Discovery sort order. Both orders page on `_id` (which encodes creation time),
 * so keyset cursor pagination stays correct. LATEST is the default.
 */
export enum AnimalSort {
  LATEST = "LATEST",
  OLDEST = "OLDEST",
}
