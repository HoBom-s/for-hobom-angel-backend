export interface DeleteAnnouncementCommand {
  announcementId: string;
  requesterId: string;
}

/** Removes a shelter notice (staff of the owning shelter, or a platform operator). */
export interface DeleteAnnouncementUseCase {
  invoke(command: DeleteAnnouncementCommand): Promise<void>;
}
