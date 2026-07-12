export interface PostFaqCommand {
  shelterId: string;
  authorId: string;
  question: string;
  answer: string;
  order: number;
}

export interface PostFaqResult {
  faqId: string;
}

/** Adds a FAQ entry to a shelter's page (staff of a verified shelter only). */
export interface PostFaqUseCase {
  invoke(command: PostFaqCommand): Promise<PostFaqResult>;
}
