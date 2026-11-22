import { afterEach, describe, expect, it, vi } from "vitest";
import {
  UNDER_TARGET_MESSAGE,
  clampBudgetMinutes,
  clientValidationError,
  requestSession,
  selectedCategories,
} from "./sessionForm";
import type { Category } from "../videos";

describe("clampBudgetMinutes", () => {
  it("keeps whole minutes within 1 to 120", () => {
    expect(clampBudgetMinutes(0)).toBe(1);
    expect(clampBudgetMinutes(0.4)).toBe(1);
    expect(clampBudgetMinutes(30.6)).toBe(31);
    expect(clampBudgetMinutes(120)).toBe(120);
    expect(clampBudgetMinutes(999)).toBe(120);
  });
});

describe("selectedCategories", () => {
  it("returns only ticked categories in spec order", () => {
    const ticked: Record<Category, boolean> = {
      Training: true,
      Fights: false,
      History: true,
    };
    expect(selectedCategories(ticked)).toEqual(["Training", "History"]);
  });
});

describe("clientValidationError", () => {
  it("requires at least one category before submitting", () => {
    expect(clientValidationError([])).toBe("Pick at least one category.");
    expect(clientValidationError(["Training"])).toBeNull();
  });
});

describe("requestSession", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns session data when the API succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        videos: [{ id: "a", title: "T", channel: "C", category: "Training", length: 60 }],
        underTarget: false,
      }),
    });
    const result = await requestSession(
      { categories: ["Training"], budgetMinutes: 30, includeShorts: false },
      fetchMock,
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories: ["Training"],
        budgetMinutes: 30,
        includeShorts: false,
      }),
    });
    expect(result).toEqual({
      ok: true,
      videos: [{ id: "a", title: "T", channel: "C", category: "Training", length: 60 }],
      underTarget: false,
    });
  });

  it("surfaces API error messages", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Pools are empty." }),
    });
    const result = await requestSession(
      { categories: ["Fights"], budgetMinutes: 10, includeShorts: false },
      fetchMock,
    );
    expect(result).toEqual({ ok: false, error: "Pools are empty." });
  });

  it("uses the thin-category message when under target", () => {
    expect(UNDER_TARGET_MESSAGE).toMatch(/85%/);
  });
});