import { describe, it, expect } from "vitest";
import { cleanOffset, localDateKey, localDayStart, streakFromDays } from "@/lib/crm/outreachStats";

// JavaScript's getTimezoneOffset: minutes behind UTC (Sydney in summer is -660, New York is +300).
describe("the rep's own day", () => {
  it("accepts a sane browser offset and ignores anything else", () => {
    expect(cleanOffset("-660")).toBe(-660);
    expect(cleanOffset(0)).toBe(0);
    expect(cleanOffset("abc")).toBe(0);
    expect(cleanOffset(99999)).toBe(0);
    expect(cleanOffset(null)).toBe(0);
  });

  it("works out the local calendar date and the start of the local day", () => {
    const at = new Date("2026-11-02T20:30:00Z"); // 07:30 on 3 Nov in Sydney (UTC+11)
    expect(localDateKey(at, -660)).toBe("2026-11-03");
    expect(localDateKey(at, 0)).toBe("2026-11-02");
    expect(localDayStart(at, -660).toISOString()).toBe("2026-11-02T13:00:00.000Z"); // local midnight on 3 Nov
    expect(localDayStart(new Date("2026-11-02T08:00:00Z"), 0).toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });
});

describe("the daily streak", () => {
  const now = new Date("2026-11-04T12:00:00Z");
  const day = (back: number) => localDateKey(new Date(now.getTime() - back * 86_400_000), 0);

  it("counts consecutive days back from today", () => {
    expect(streakFromDays([day(0), day(1), day(2)], now, 0)).toBe(3);
  });
  it("does not break the streak just because today has no send yet", () => {
    expect(streakFromDays([day(1), day(2), day(3)], now, 0)).toBe(3);
  });
  it("stops at the first missed day, and is zero with no activity", () => {
    expect(streakFromDays([day(0), day(1), day(3)], now, 0)).toBe(2);
    expect(streakFromDays([], now, 0)).toBe(0);
    expect(streakFromDays([day(5)], now, 0)).toBe(0);
  });
  it("is not capped by how many emails were sent: only the days matter", () => {
    expect(streakFromDays([day(0), day(0), day(1)], now, 0)).toBe(2);
  });
});
