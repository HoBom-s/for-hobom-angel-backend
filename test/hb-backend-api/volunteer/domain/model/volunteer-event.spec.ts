import { VolunteerEventStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-event-status.enum";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";

const START = new Date("2027-01-01T10:00:00.000Z");
const END = new Date("2027-01-01T12:00:00.000Z");
const BEFORE = new Date("2026-12-01T00:00:00.000Z");
const AFTER = new Date("2027-02-01T00:00:00.000Z");

const open = (over: Partial<Parameters<typeof VolunteerEvent.open>[0]> = {}) =>
  VolunteerEvent.open({
    shelterId: ShelterId.generate(),
    title: "유기견 목욕 봉사",
    startAt: START,
    endAt: END,
    capacity: 2,
    ...over,
  });

describe("VolunteerEvent", () => {
  describe("open", () => {
    it("opens with an empty roster", () => {
      const event = open();
      expect(event.getStatus).toBe(VolunteerEventStatus.OPEN);
      expect(event.getSignedUpCount).toBe(0);
    });

    it("rejects invalid capacity, title, and time range", () => {
      expect(() => open({ capacity: 0 })).toThrow("모집 인원");
      expect(() => open({ title: "  " })).toThrow("제목");
      expect(() => open({ startAt: END, endAt: START })).toThrow("시간");
    });
  });

  describe("reserveSlot", () => {
    it("fills up to capacity then refuses", () => {
      const event = open({ capacity: 2 });
      event.reserveSlot(BEFORE);
      event.reserveSlot(BEFORE);
      expect(event.getSignedUpCount).toBe(2);
      expect(event.isFull()).toBe(true);
      expect(() => event.reserveSlot(BEFORE)).toThrow("모집 인원이 찼");
    });

    it("refuses once the event has started", () => {
      expect(() => open().reserveSlot(AFTER)).toThrow("이미 시작된");
    });

    it("refuses when not open", () => {
      const event = open();
      event.close();
      expect(() => event.reserveSlot(BEFORE)).toThrow("모집 중인 봉사가 아니");
    });
  });

  it("releaseSlot frees a slot and floors at zero", () => {
    const event = open({ capacity: 1 });
    event.reserveSlot(BEFORE);
    event.releaseSlot();
    expect(event.getSignedUpCount).toBe(0);
    event.releaseSlot();
    expect(event.getSignedUpCount).toBe(0);
  });

  describe("status", () => {
    it("close: OPEN → CLOSED", () => {
      const event = open();
      event.close();
      expect(event.getStatus).toBe(VolunteerEventStatus.CLOSED);
    });

    it("cancel: from OPEN or CLOSED → CANCELLED", () => {
      const a = open();
      a.cancel();
      expect(a.getStatus).toBe(VolunteerEventStatus.CANCELLED);
      expect(() => a.cancel()).toThrow("취소");

      const b = open();
      b.close();
      b.cancel();
      expect(b.getStatus).toBe(VolunteerEventStatus.CANCELLED);
    });
  });

  describe("acceptsSignups", () => {
    it("is true only while OPEN, before start, and not full", () => {
      expect(open().acceptsSignups(BEFORE)).toBe(true);
      expect(open().acceptsSignups(AFTER)).toBe(false);

      const full = open({ capacity: 1 });
      full.reserveSlot(BEFORE);
      expect(full.acceptsSignups(BEFORE)).toBe(false);

      const closed = open();
      closed.close();
      expect(closed.acceptsSignups(BEFORE)).toBe(false);
    });
  });
});
