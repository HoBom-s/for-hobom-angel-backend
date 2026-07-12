export interface EditAnnouncementCommand {
  announcementId: string;
  editorId: string;
  title: string;
  body: string;
  pinned: boolean;
}

/** Edits a shelter notice (any staff of the owning shelter). */
export interface EditAnnouncementUseCase {
  invoke(command: EditAnnouncementCommand): Promise<void>;
}
