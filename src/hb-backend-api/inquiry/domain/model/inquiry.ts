import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { InquiryId } from "src/hb-backend-api/inquiry/domain/model/vo/inquiry-id.vo";

/**
 * A general inquiry thread between a member and a shelter, opened from an animal
 * detail ("보호소에 문의하기") — not tied to an adoption/foster application. The
 * thread is the identity; the messages live in the shared messaging domain,
 * keyed by (INQUIRY, inquiryId). One thread per (inquirer, animal).
 */
export class Inquiry {
  private constructor(
    private readonly id: InquiryId,
    private readonly shelterId: ShelterId,
    private readonly inquirerId: UserId,
    private readonly animalId: AnimalId | null,
    private readonly createdAt: Date | null,
  ) {}

  public static open(params: {
    shelterId: ShelterId;
    inquirerId: UserId;
    animalId?: AnimalId | null;
  }): Inquiry {
    return new Inquiry(
      InquiryId.generate(),
      params.shelterId,
      params.inquirerId,
      params.animalId ?? null,
      null,
    );
  }

  public static reconstitute(params: {
    id: InquiryId;
    shelterId: ShelterId;
    inquirerId: UserId;
    animalId: AnimalId | null;
    createdAt: Date | null;
  }): Inquiry {
    return new Inquiry(
      params.id,
      params.shelterId,
      params.inquirerId,
      params.animalId,
      params.createdAt,
    );
  }

  public isOwnedBy(userId: UserId): boolean {
    return this.inquirerId.equals(userId);
  }

  public get getId(): InquiryId {
    return this.id;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getInquirerId(): UserId {
    return this.inquirerId;
  }
  public get getAnimalId(): AnimalId | null {
    return this.animalId;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
}
