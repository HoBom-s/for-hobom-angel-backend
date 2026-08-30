import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Page } from "src/shared/pagination/page";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import {
  GetLatestMessagesUseCase,
  LatestMessage,
} from "src/hb-backend-api/messaging/domain/ports/in/get-latest-messages.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryListItem } from "src/hb-backend-api/inquiry/domain/ports/in/inquiry-list-item";
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
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.MessagingModule.GetLatestMessagesUseCase)
    private readonly getLatestMessages: GetLatestMessagesUseCase,
  ) {}

  public async invoke(
    query: ListShelterInquiriesQuery,
  ): Promise<Page<InquiryListItem>> {
    const shelterId = ShelterId.fromString(query.shelterId);
    const viewer = await this.userQueryPort.findById(
      UserId.fromString(query.actorId),
    );
    if (!viewer || !viewer.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 스태프만 문의함을 볼 수 있어요.");
    }

    const page = await this.inquiryQueryPort.findPageByShelter(
      shelterId,
      query.cursor ?? null,
      query.limit,
    );

    const latestByRef = await this.loadLatestByRef(page.items);

    const items = await Promise.all(
      page.items.map(async (inquiry) => {
        const animalId = inquiry.getAnimalId;
        const [animal, inquirer] = await Promise.all([
          animalId ? this.animalQueryPort.findById(animalId) : null,
          this.userQueryPort.findById(inquiry.getInquirerId),
        ]);
        const last = latestByRef.get(inquiry.getId.toString()) ?? null;
        return {
          inquiry,
          animalName: animal?.getName ?? null,
          // Shelter inbox — the counterpart is the inquiring member.
          counterpartName: inquirer?.getNickname.raw ?? null,
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
