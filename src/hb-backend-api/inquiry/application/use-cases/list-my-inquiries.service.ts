import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import {
  ListMyInquiriesQuery,
  ListMyInquiriesUseCase,
} from "src/hb-backend-api/inquiry/domain/ports/in/list-my-inquiries.use-case";
import { InquiryQueryPort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-query.port";

@Injectable()
export class ListMyInquiriesService implements ListMyInquiriesUseCase {
  constructor(
    @Inject(DIToken.InquiryModule.InquiryQueryPort)
    private readonly inquiryQueryPort: InquiryQueryPort,
  ) {}

  public invoke(query: ListMyInquiriesQuery): Promise<Page<Inquiry>> {
    return this.inquiryQueryPort.findPageByInquirer(
      UserId.fromString(query.inquirerId),
      query.cursor ?? null,
      query.limit,
    );
  }
}
