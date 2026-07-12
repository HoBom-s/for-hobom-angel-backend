import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { FaqId } from "src/hb-backend-api/faq/domain/model/vo/faq-id.vo";

const MAX_QUESTION_LENGTH = 200;
const MAX_ANSWER_LENGTH = 5000;

/**
 * FAQ aggregate — one question/answer a shelter publishes to its page. Shelter-
 * owned content: the shelter is the consistency boundary, and any of its staff
 * may edit or remove it. `order` controls the display position (ascending).
 */
export class Faq {
  private constructor(
    private readonly id: FaqId,
    private readonly shelterId: ShelterId,
    private readonly authorId: UserId,
    private question: string,
    private answer: string,
    private order: number,
    private readonly createdAt: Date | null,
    private readonly version: number,
  ) {}

  public static post(params: {
    shelterId: ShelterId;
    authorId: UserId;
    question: string;
    answer: string;
    order: number;
  }): Faq {
    return new Faq(
      FaqId.generate(),
      params.shelterId,
      params.authorId,
      Faq.cleanQuestion(params.question),
      Faq.cleanAnswer(params.answer),
      Faq.cleanOrder(params.order),
      null,
      0,
    );
  }

  public static reconstitute(params: {
    id: FaqId;
    shelterId: ShelterId;
    authorId: UserId;
    question: string;
    answer: string;
    order: number;
    createdAt: Date | null;
    version: number;
  }): Faq {
    return new Faq(
      params.id,
      params.shelterId,
      params.authorId,
      params.question,
      params.answer,
      params.order,
      params.createdAt,
      params.version,
    );
  }

  public edit(params: {
    question: string;
    answer: string;
    order: number;
  }): void {
    this.question = Faq.cleanQuestion(params.question);
    this.answer = Faq.cleanAnswer(params.answer);
    this.order = Faq.cleanOrder(params.order);
  }

  private static cleanQuestion(question: string): string {
    const trimmed = question?.trim() ?? "";
    if (!trimmed) {
      throw new Error("질문을 입력해 주세요.");
    }
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      throw new Error(`질문은 ${MAX_QUESTION_LENGTH}자 이하로 작성해 주세요.`);
    }
    return trimmed;
  }

  private static cleanAnswer(answer: string): string {
    const trimmed = answer?.trim() ?? "";
    if (!trimmed) {
      throw new Error("답변을 입력해 주세요.");
    }
    if (trimmed.length > MAX_ANSWER_LENGTH) {
      throw new Error(`답변은 ${MAX_ANSWER_LENGTH}자 이하로 작성해 주세요.`);
    }
    return trimmed;
  }

  private static cleanOrder(order: number): number {
    if (!Number.isInteger(order) || order < 0) {
      throw new Error("정렬 순서는 0 이상의 정수여야 해요.");
    }
    return order;
  }

  public get getId(): FaqId {
    return this.id;
  }
  public get getShelterId(): ShelterId {
    return this.shelterId;
  }
  public get getAuthorId(): UserId {
    return this.authorId;
  }
  public get getQuestion(): string {
    return this.question;
  }
  public get getAnswer(): string {
    return this.answer;
  }
  public get getOrder(): number {
    return this.order;
  }
  public get getCreatedAt(): Date | null {
    return this.createdAt;
  }
  public get getVersion(): number {
    return this.version;
  }
}
