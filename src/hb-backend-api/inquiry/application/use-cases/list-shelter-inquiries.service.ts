import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import {
  ListShelterInquiriesQuery,
  ListShelterInquiriesUseCase,
} from "src/hb-backend-api/inquiry/domain/ports/in/list-shelter-inquiries.use-case";
import { InquiryQueryPort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-query.port";

@Injectable()
export class ListShelterInquiriesService implements ListShelterInquiriesUseCase {
  constructor(
    @Inject(DIToken.InquiryModule.InquiryQueryPort)
    private readonly inquiryQueryPort: InquiryQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  public async invoke(
    query: ListShelterInquiriesQuery,
  ): Promise<Page<Inquiry>> {
    const shelterId = ShelterId.fromString(query.shelterId);
    const viewer = await this.userQueryPort.findById(
      UserId.fromString(query.actorId),
    );
    if (!viewer || !viewer.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 스태프만 문의함을 볼 수 있어요.");
    }
    return this.inquiryQueryPort.findPageByShelter(
      shelterId,
      query.cursor ?? null,
      query.limit,
    );
  }
}
