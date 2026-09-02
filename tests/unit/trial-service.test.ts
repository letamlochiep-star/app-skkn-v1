import { describe, it, expect } from "vitest";
import {
  initializeTrialSubscription,
  calculateTrialStatus,
  TRIAL_DURATION_DAYS,
  TRIAL_DURATION_MS,
  type SubscriptionRecord,
} from "@/server/services/trial-service";

describe("3-Day Trial System & Server Time Enforcement", () => {
  const baseServerTime = new Date("2026-09-02T10:00:00.000Z");

  it("should initialize trial with exactly 3 days duration from server time", () => {
    const sub = initializeTrialSubscription("user-123", baseServerTime);

    expect(sub.userId).toBe("user-123");
    expect(sub.planCode).toBe("FREE_TRIAL");
    expect(sub.status).toBe("ACTIVE");
    expect(sub.trialStartedAt).toBe(baseServerTime.toISOString());

    const expectedExpiry = new Date(baseServerTime.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(sub.trialExpiresAt).toBe(expectedExpiry);
  });

  it("should report ACTIVE trial when checked at day 1 on server", () => {
    const sub = initializeTrialSubscription("user-123", baseServerTime);
    const day1ServerTime = new Date("2026-09-03T10:00:00.000Z"); // 1 day later

    const status = calculateTrialStatus(sub, day1ServerTime);
    expect(status.isTrial).toBe(true);
    expect(status.isActive).toBe(true);
    expect(status.isExpired).toBe(false);
    expect(status.remainingDays).toBe(2);
  });

  it("should report EXPIRED when server time passes 3 days", () => {
    const sub = initializeTrialSubscription("user-123", baseServerTime);
    const day4ServerTime = new Date("2026-09-05T10:00:01.000Z"); // 3 days and 1 second later

    const status = calculateTrialStatus(sub, day4ServerTime);
    expect(status.isTrial).toBe(true);
    expect(status.isActive).toBe(false);
    expect(status.isExpired).toBe(true);
    expect(status.remainingMs).toBe(0);
    expect(status.formattedRemaining).toBe("Hết hạn dùng thử");
  });

  it("should NOT reset trial expiration upon re-login or session reload", () => {
    const initialSub = initializeTrialSubscription("user-123", baseServerTime);
    const originalExpiry = initialSub.trialExpiresAt;

    // Simulate user logging out and logging in again at day 2
    const loginDay2ServerTime = new Date("2026-09-04T10:00:00.000Z");
    const reloadedSub: SubscriptionRecord = { ...initialSub }; // Loaded from DB

    const status = calculateTrialStatus(reloadedSub, loginDay2ServerTime);
    expect(reloadedSub.trialExpiresAt).toBe(originalExpiry);
    expect(status.remainingDays).toBe(1);
  });

  it("should ignore client-side time manipulation and rely strictly on server time", () => {
    const sub = initializeTrialSubscription("user-123", baseServerTime);

    // Suppose a rogue user sets their local device clock back to 2025:
    // Server evaluates with its own clock (2026-09-06 = expired)
    const actualServerTime = new Date("2026-09-06T12:00:00.000Z");
    const status = calculateTrialStatus(sub, actualServerTime);

    expect(status.isExpired).toBe(true);
    expect(status.isActive).toBe(false);
  });
});
