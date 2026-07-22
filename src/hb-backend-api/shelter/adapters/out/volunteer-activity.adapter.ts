import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";
import { VolunteerActivityPort } from "src/hb-backend-api/shelter/domain/ports/out/volunteer-activity.port";

/**
 * Reads the volunteer_signups collection directly (the model is registered in
 * ShelterModule's forFeature) rather than depending on VolunteerModule, which
 * would create a cycle. Read-only — it never writes another domain's data.
 */
@Injectable()
export class VolunteerActivityAdapter implements VolunteerActivityPort {
  constructor(
    @InjectModel(VolunteerSignupEntity.name)
    private readonly signupModel: Model<VolunteerSignupEntity>,
  ) {}

  public countApprovedByVolunteer(userId: string): Promise<number> {
    return this.signupModel
      .countDocuments({
        volunteerId: new Types.ObjectId(userId),
        status: VolunteerSignupStatus.APPROVED,
      })
      .exec();
  }
}
