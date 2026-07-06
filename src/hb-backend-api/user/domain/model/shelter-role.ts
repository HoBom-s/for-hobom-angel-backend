import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";

/**
 * A shelter-scoped role grant. SHELTER_STAFF/SHELTER_ADMIN authority is limited
 * to a single shelterId (tenancy + RBAC). Platform-wide roles
 * (USER, SYSTEM_ADMIN) live in `User.roles` with no shelter scope.
 */
@Schema({ _id: false })
export class ShelterRole {
  @Prop({ type: Types.ObjectId, ref: "shelters", required: true })
  public shelterId: Types.ObjectId;

  @Prop({ required: true, enum: UserRole, type: String })
  public role: UserRole;
}
