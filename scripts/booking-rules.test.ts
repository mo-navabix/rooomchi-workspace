import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateBookingSchedule,
  earliestStartTimeForDate,
} from "../src/utils/bookingRules";

test("rejects past dates", () => {
  const err = validateBookingSchedule({
    date: "2020-01-01",
    startTime: "10:00",
    endTime: "11:00",
    workStart: "08:00",
    workEnd: "18:00",
    maxBookingHours: 4,
    now: new Date("2026-10-27T15:00:00"),
  });
  assert.equal(err, "امکان رزرو برای تاریخ گذشته وجود ندارد");
});

test("rejects past start time on today", () => {
  const err = validateBookingSchedule({
    date: "2026-10-27",
    startTime: "08:00",
    endTime: "09:00",
    workStart: "08:00",
    workEnd: "18:00",
    maxBookingHours: 4,
    now: new Date("2026-10-27T15:00:00"),
  });
  assert.equal(err, "ساعت شروع نمی‌تواند در گذشته باشد");
});

test("earliest start on today rounds up from now", () => {
  const t = earliestStartTimeForDate(
    "2026-10-27",
    "08:00",
    "18:00",
    new Date("2026-10-27T15:07:00"),
  );
  assert.equal(t, "15:15");
});
