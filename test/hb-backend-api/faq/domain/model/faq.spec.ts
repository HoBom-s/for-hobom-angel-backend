import { Types } from "mongoose";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Faq } from "src/hb-backend-api/faq/domain/model/faq";

const post = (
  over: { question?: string; answer?: string; order?: number } = {},
) =>
  Faq.post({
    shelterId: new ShelterId(new Types.ObjectId()),
    authorId: UserId.generate(),
    question: over.question ?? "입양 절차가 어떻게 되나요?",
    answer: over.answer ?? "신청서 작성 후 상담을 진행해요.",
    order: over.order ?? 0,
  });

describe("Faq aggregate", () => {
  it("posts an entry, trimming fields and starting at version 0", () => {
    const faq = post({ question: "  질문  ", answer: "  답변  ", order: 3 });
    expect(faq.getQuestion).toBe("질문");
    expect(faq.getAnswer).toBe("답변");
    expect(faq.getOrder).toBe(3);
    expect(faq.getVersion).toBe(0);
  });

  it("rejects empty question or answer", () => {
    expect(() => post({ question: "   " })).toThrow("질문");
    expect(() => post({ answer: "   " })).toThrow("답변");
  });

  it("rejects an over-long question and a negative order", () => {
    expect(() => post({ question: "가".repeat(201) })).toThrow("200자");
    expect(() => post({ order: -1 })).toThrow("정렬 순서");
  });

  it("edit replaces question/answer/order", () => {
    const faq = post({ order: 0 });
    faq.edit({ question: "새 질문", answer: "새 답변", order: 5 });
    expect(faq.getQuestion).toBe("새 질문");
    expect(faq.getAnswer).toBe("새 답변");
    expect(faq.getOrder).toBe(5);
  });
});
