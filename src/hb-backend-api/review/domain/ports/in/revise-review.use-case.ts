export interface ReviseReviewCommand {
  reviewId: string;
  editorId: string;
  rating: number;
  body: string;
}

/** Edits the caller's own review (rating/body only). */
export interface ReviseReviewUseCase {
  invoke(command: ReviseReviewCommand): Promise<void>;
}
