export interface DeleteFaqCommand {
  faqId: string;
  requesterId: string;
}

/** Removes a FAQ entry (staff of the owning shelter, or a platform operator). */
export interface DeleteFaqUseCase {
  invoke(command: DeleteFaqCommand): Promise<void>;
}
