import type { Category } from "../videos";
import type { SessionApiBody, SessionApiSuccess, SessionApiVideo } from "./sessionApi";

export const MIN_BUDGET_MINUTES = 1;
export const MAX_BUDGET_MINUTES = 120;

export const CATEGORY_OPTIONS: readonly Category[] = ["Training", "Fights", "History"];

export const UNDER_TARGET_MESSAGE =
  "This category could not fill its share of the time budget. Your session is shorter than the usual 85% target.";

export function clampBudgetMinutes(value: number): number {
  return Math.min(
    MAX_BUDGET_MINUTES,
    Math.max(MIN_BUDGET_MINUTES, Math.round(value)),
  );
}

export function selectedCategories(ticked: Record<Category, boolean>): Category[] {
  return CATEGORY_OPTIONS.filter((category) => ticked[category]);
}

export function clientValidationError(categories: Category[]): string | null {
  if (categories.length === 0) {
    return "Pick at least one category.";
  }
  return null;
}

export type SessionFormSuccess = {
  ok: true;
  videos: SessionApiVideo[];
  underTarget: boolean;
};

export type SessionFormFailure = {
  ok: false;
  error: string;
};

export type SessionFormResult = SessionFormSuccess | SessionFormFailure;

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export async function requestSession(
  body: SessionApiBody,
  fetchFn: FetchLike = fetch,
): Promise<SessionFormResult> {
  const response = await fetchFn("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as SessionApiSuccess | { error?: string };

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
        ? data.error
        : "Could not build a session.";
    return { ok: false, error: message };
  }

  if (!("videos" in data) || !Array.isArray(data.videos)) {
    return { ok: false, error: "Could not build a session." };
  }

  return {
    ok: true,
    videos: data.videos,
    underTarget: Boolean(data.underTarget),
  };
}