export interface ChangeNicknameCommand {
  userId: string;
  nickname: string;
}

/** Renames the caller's public display name (unique across active members). */
export interface ChangeNicknameUseCase {
  invoke(command: ChangeNicknameCommand): Promise<void>;
}
