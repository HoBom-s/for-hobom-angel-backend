export interface CreateVolunteerPostCommand {
  authorId: string;
  eventId?: string;
  body: string;
  imageKeys?: string[];
}

export interface CreateVolunteerPostResult {
  postId: string;
}

/** A member publishes a volunteer review/promo post (§05). */
export interface CreateVolunteerPostUseCase {
  invoke(
    command: CreateVolunteerPostCommand,
  ): Promise<CreateVolunteerPostResult>;
}
