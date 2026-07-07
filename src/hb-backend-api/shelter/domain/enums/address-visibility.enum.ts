/** How much of a shelter's address is public (the shelter chooses). */
export enum AddressVisibility {
  /** Full road address + precise coordinates. */
  FULL = "FULL",
  /** Region + district only, approximate coordinates (map-visible). */
  PARTIAL = "PARTIAL",
  /** Region only, no coordinates (excluded from map). */
  HIDDEN = "HIDDEN",
}
