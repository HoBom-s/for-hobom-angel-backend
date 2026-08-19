import { Page } from "src/shared/pagination/page";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import { InquiryId } from "src/hb-backend-api/inquiry/domain/model/vo/inquiry-id.vo";

export interface InquiryQueryPort {
  findById(id: InquiryId): Promise<Inquiry | null>;
  /** The member's existing thread for an animal, if any (find-or-create). */
  findByInquirerAndAnimal(
    inquirerId: UserId,
    animalId: AnimalId,
  ): Promise<Inquiry | null>;
  findPageByInquirer(
    inquirerId: UserId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Inquiry>>;
  findPageByShelter(
    shelterId: ShelterId,
    cursor: string | null,
    limit: number,
  ): Promise<Page<Inquiry>>;
}
