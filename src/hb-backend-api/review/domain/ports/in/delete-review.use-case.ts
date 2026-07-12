export interface DeleteReviewCommand {
  reviewId: string;
  requesterId: string;
}

/** Removes a review — allowed for its author or a platform operator. */
export interface DeleteReviewUseCase {
  invoke(command: DeleteReviewCommand): Promise<void>;
}
