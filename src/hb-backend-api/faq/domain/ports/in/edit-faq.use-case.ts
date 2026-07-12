export interface EditFaqCommand {
  faqId: string;
  editorId: string;
  question: string;
  answer: string;
  order: number;
}

/** Edits a FAQ entry (any staff of the owning shelter). */
export interface EditFaqUseCase {
  invoke(command: EditFaqCommand): Promise<void>;
}
