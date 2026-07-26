/**
 * A read-only window onto a member's volunteer activity, used to enrich the
 * staff-promotion queue with each candidate's track record. It is a shelter-side
 * port (not a VolunteerModule dependency) on purpose: VolunteerModule already
 * imports ShelterModule, so importing it back would cycle. The adapter reads the
 * volunteer_signups collection directly instead.
 */
export interface VolunteerActivityPort {
  /** How many of a member's volunteer sign-ups were approved (their 봉사 N회). */
  countApprovedByVolunteer(userId: string): Promise<number>;
}
