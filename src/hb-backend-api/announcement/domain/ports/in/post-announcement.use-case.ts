export interface PostAnnouncementCommand {
  shelterId: string;
  authorId: string;
  title: string;
  body: string;
  pinned: boolean;
}

export interface PostAnnouncementResult {
  announcementId: string;
}

/** Publishes a notice to a shelter's page (staff of a verified shelter only). */
export interface PostAnnouncementUseCase {
  invoke(command: PostAnnouncementCommand): Promise<PostAnnouncementResult>;
}
