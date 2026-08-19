import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";

export interface InquiryPersistencePort {
  create(inquiry: Inquiry): Promise<void>;
}
