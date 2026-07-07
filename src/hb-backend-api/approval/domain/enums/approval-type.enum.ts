/**
 * The kinds of decision the one approval engine handles. Each type has a
 * completion callback that transitions the target domain aggregate in the same
 * transaction (see the callback registry).
 */
export enum ApprovalType {
  SHELTER_VERIFICATION = "SHELTER_VERIFICATION",
  STAFF_PROMOTION = "STAFF_PROMOTION",
  ADOPTION = "ADOPTION",
  FOSTER = "FOSTER",
}
