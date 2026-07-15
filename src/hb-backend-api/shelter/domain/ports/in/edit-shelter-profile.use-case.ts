/**
 * §07 About-content edit. Every field is optional and independently patchable:
 * `undefined` keeps the current value, an empty string clears it. `operatingSince`
 * is an ISO date; the rest are Markdown/plain text or an image object key.
 */
export interface EditShelterProfileCommand {
  shelterId: string;
  /** The staff/admin member editing — must belong to the shelter. */
  editorId: string;
  intro?: string;
  operatingSince?: Date;
  representativeName?: string;
  visitGuide?: string;
  supportGuide?: string;
  coverImageKey?: string;
}

export interface EditShelterProfileUseCase {
  invoke(command: EditShelterProfileCommand): Promise<void>;
}
