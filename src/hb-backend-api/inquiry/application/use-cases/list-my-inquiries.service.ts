import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import {
  GetLatestMessagesUseCase,
  LatestMessage,
} from "src/hb-backend-api/messaging/domain/ports/in/get-latest-messages.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryListItem } from "src/hb-backend-api/inquiry/domain/ports/in/inquiry-list-item";
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
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.MessagingModule.GetLatestMessagesUseCase)
    private readonly getLatestMessages: GetLatestMessagesUseCase,
  ) {}

  public async invoke(
    query: ListMyInquiriesQuery,
  ): Promise<Page<InquiryListItem>> {
    const page = await this.inquiryQueryPort.findPageByInquirer(
      UserId.fromString(query.inquirerId),
      query.cursor ?? null,
      query.limit,
    );

    const latestByRef = await this.loadLatestByRef(page.items);

    const items = await Promise.all(
      page.items.map(async (inquiry) => {
        const animalId = inquiry.getAnimalId;
        const [animal, shelter] = await Promise.all([
          animalId ? this.animalQueryPort.findById(animalId) : null,
          this.shelterQueryPort.findById(inquiry.getShelterId),
        ]);
        const last = latestByRef.get(inquiry.getId.toString()) ?? null;
        return {
          inquiry,
          animalName: animal?.getName ?? null,
          // "내 문의" — the counterpart is the shelter.
          counterpartName: shelter?.getName ?? null,
          lastMessage: last
            ? {
                body: last.body,
                senderRole: last.senderRole,
                sentAt: last.sentAt,
              }
            : null,
        };
      }),
    );

    return { items, nextCursor: page.nextCursor, hasNext: page.hasNext };
  }

  private async loadLatestByRef(
    inquiries: Inquiry[],
  ): Promise<Map<string, LatestMessage>> {
    const refs = inquiries.map((inquiry) => inquiry.getId.toString());
    const latest = await this.getLatestMessages.invoke(
      MessageSubjectType.INQUIRY,
      refs,
    );
    return new Map(latest.map((message) => [message.subjectRef, message]));
  }
}
