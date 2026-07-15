export interface LikeVolunteerPostCommand {
  postId: string;
  userId: string;
}

/** Toggles a member's like on a post. Both directions are idempotent. */
export interface LikeVolunteerPostUseCase {
  like(command: LikeVolunteerPostCommand): Promise<void>;
  unlike(command: LikeVolunteerPostCommand): Promise<void>;
}
