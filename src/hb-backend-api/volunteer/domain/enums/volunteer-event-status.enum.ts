/**
 * Volunteer event lifecycle. OPEN accepts signups; CLOSED stops them (full or by
 * the organizer); CANCELLED is called off. Only OPEN → CLOSED/CANCELLED and
 * CLOSED → CANCELLED are allowed.
 */
export enum VolunteerEventStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}
