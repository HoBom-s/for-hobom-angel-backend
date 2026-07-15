export interface DeleteVolunteerPostCommand {
  postId: string;
  requesterId: string;
}

/** The author removes their own post; a platform operator may moderate any. */
export interface DeleteVolunteerPostUseCase {
  invoke(command: DeleteVolunteerPostCommand): Promise<void>;
}
