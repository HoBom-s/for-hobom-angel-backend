import { User } from "src/hb-backend-api/user/domain/model/user";

export interface GetShelterStaffQuery {
  shelterId: string;
  /** The caller — must be staff of the shelter. */
  actorId: string;
}

/** The shelter's staff roster (its members and their roles). Staff only. */
export interface GetShelterStaffUseCase {
  invoke(query: GetShelterStaffQuery): Promise<User[]>;
}
