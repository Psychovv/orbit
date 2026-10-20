import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clientKey,
  clientKeyFromHeaders,
  rateLimit,
  rateLimitRetryAfterMs,
  resetRateLimit,
} from "./rate-limit";

const KEY = "test-client";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"));
    resetRateLimit(KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to the limit and blocks the next call", () => {
    expect(rateLimit(KEY, 3, 60_000)).toBe(true);
    expect(rateLimit(KEY, 3, 60_000)).toBe(true);
    expect(rateLimit(KEY, 3, 60_000)).toBe(true);
    expect(rateLimit(KEY, 3, 60_000)).toBe(false);
  });

  it("frees a slot once the oldest hit leaves the window", () => {
    rateLimit(KEY, 2, 60_000);
    vi.advanceTimersByTime(30_000);
    rateLimit(KEY, 2, 60_000);
    expect(rateLimit(KEY, 2, 60_000)).toBe(false);

    vi.advanceTimersByTime(30_001);
    expect(rateLimit(KEY, 2, 60_000)).toBe(true);
    expect(rateLimit(KEY, 2, 60_000)).toBe(false);
  });

  it("does not count blocked calls against the window", () => {
    rateLimit(KEY, 1, 60_000);
    vi.advanceTimersByTime(59_000);
    expect(rateLimit(KEY, 1, 60_000)).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rateLimit(KEY, 1, 60_000)).toBe(true);
  });

  it("tracks keys independently", () => {
    rateLimit(KEY, 1, 60_000);
    expect(rateLimit(`${KEY}-other`, 1, 60_000)).toBe(true);
    resetRateLimit(`${KEY}-other`);
  });

  it("starts over after a reset", () => {
    rateLimit(KEY, 1, 60_000);
    resetRateLimit(KEY);
    expect(rateLimit(KEY, 1, 60_000)).toBe(true);
  });
});

describe("rateLimitRetryAfterMs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"));
    resetRateLimit(KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null while there is quota left", () => {
    rateLimit(KEY, 2, 60_000);
    expect(rateLimitRetryAfterMs(KEY, 2, 60_000)).toBeNull();
  });

  it("returns the time until the oldest hit expires", () => {
    rateLimit(KEY, 1, 60_000);
    vi.advanceTimersByTime(20_000);
    expect(rateLimitRetryAfterMs(KEY, 1, 60_000)).toBe(40_000);
  });

  it("never suggests less than one second", () => {
    rateLimit(KEY, 1, 60_000);
    vi.advanceTimersByTime(59_900);
    expect(rateLimitRetryAfterMs(KEY, 1, 60_000)).toBe(1_000);
  });
});

describe("clientKeyFromHeaders", () => {
  it("uses the first x-forwarded-for address", () => {
    const headers = new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1", "x-real-ip": "198.51.100.2" });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip and then to local", () => {
    expect(clientKeyFromHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientKeyFromHeaders(new Headers())).toBe("local");
  });

  it("reads the headers of a Request", () => {
    const req = new Request("http://localhost/api", { headers: { "x-real-ip": "198.51.100.2" } });
    expect(clientKey(req)).toBe("198.51.100.2");
  });
});
