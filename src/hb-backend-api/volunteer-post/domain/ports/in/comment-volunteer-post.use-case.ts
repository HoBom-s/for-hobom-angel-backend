export interface CreateCommentCommand {
  postId: string;
  authorId: string;
  body: string;
}

export interface CreateCommentResult {
  commentId: string;
}

export interface DeleteCommentCommand {
  commentId: string;
  requesterId: string;
}

/** A member comments on a post; the author (or an operator) may delete. */
export interface CommentVolunteerPostUseCase {
  create(command: CreateCommentCommand): Promise<CreateCommentResult>;
  delete(command: DeleteCommentCommand): Promise<void>;
}
