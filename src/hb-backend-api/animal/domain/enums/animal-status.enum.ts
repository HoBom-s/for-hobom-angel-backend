/**
 * Adoption lifecycle of an animal. The Animal aggregate OWNS these transitions —
 * adoption/foster approvals ask the animal to move (markAdopted/markFostered),
 * they don't set the field. Flow:
 *   AVAILABLE ⇄ RESERVED → ADOPTED | FOSTERED
 *   FOSTERED → ADOPTED (foster-to-adopt) | AVAILABLE (foster ended)
 *   ADOPTED → RETURNED → AVAILABLE (re-listed)
 */
export enum AnimalStatus {
  /** Open to adoption/foster applications. */
  AVAILABLE = "AVAILABLE",
  /** An application is in progress; not open to others. */
  RESERVED = "RESERVED",
  /** In temporary care (임시보호). */
  FOSTERED = "FOSTERED",
  /** Adoption completed. */
  ADOPTED = "ADOPTED",
  /** Returned after adoption (파양/반환); re-listable. */
  RETURNED = "RETURNED",
}
