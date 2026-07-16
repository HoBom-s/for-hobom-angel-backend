export interface BookmarkVolunteerPostCommand {
  postId: string;
  userId: string;
}

/** Toggles a member's bookmark (save) on a post. Both directions are idempotent. */
export interface BookmarkVolunteerPostUseCase {
  bookmark(command: BookmarkVolunteerPostCommand): Promise<void>;
  unbookmark(command: BookmarkVolunteerPostCommand): Promise<void>;
}
