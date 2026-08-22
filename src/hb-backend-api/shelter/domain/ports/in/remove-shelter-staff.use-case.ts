export interface RemoveShelterStaffCommand {
  shelterId: string;
  /** The staff member being removed. */
  targetUserId: string;
  /** The shelter admin performing the removal. */
  actorId: string;
}

/**
 * Revokes a member's SHELTER_STAFF grant at a shelter. Only a shelter admin may
 * remove staff; an admin/representative cannot be removed through this path
 * (they hold an admin grant, not a staff grant).
 */
export interface RemoveShelterStaffUseCase {
  invoke(command: RemoveShelterStaffCommand): Promise<void>;
}
