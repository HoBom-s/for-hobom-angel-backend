import { PostBlockInput } from "src/hb-backend-api/volunteer-post/domain/model/vo/post-block";

export interface CreateVolunteerPostCommand {
  authorId: string;
  /** The shelter this review is about (required). */
  shelterId: string;
  /** An optional specific event of that shelter. */
  eventId?: string;
  /** Ordered body blocks (text + inline images). */
  content: PostBlockInput[];
}

export interface CreateVolunteerPostResult {
  postId: string;
}

/** A member publishes a volunteer review/promo post about a shelter (§05). */
export interface CreateVolunteerPostUseCase {
  invoke(
    command: CreateVolunteerPostCommand,
  ): Promise<CreateVolunteerPostResult>;
}
