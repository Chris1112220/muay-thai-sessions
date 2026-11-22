import type { Category } from "../videos";
import {
  CATEGORIES,
  type SessionApiBody,
  type SessionApiSuccess,
  type SessionApiVideo,
} from "./sessionApi";

export const MIN_BUDGET_MINUTES = 1;
export const MAX_BUDGET_MINUTES = 120;

export const CATEGORY_OPTIONS = CATEGORIES;

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

const DEFAULT_SESSION_ERROR = "Could not build a session.";

function readApiErrorMessage(data: unknown): string {
  if (typeof data === "object" && data !== null && "error" in data) {
    const message = (data as { error: unknown }).error;
    if (typeof message === "string") {
      return message;
    }
  }
  return DEFAULT_SESSION_ERROR;
}

function isSessionApiSuccess(data: unknown): data is SessionApiSuccess {
  return (
    typeof data === "object" &&
    data !== null &&
    "videos" in data &&
    Array.isArray((data as SessionApiSuccess).videos)
  );
}

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

  const data: unknown = await response.json();

  if (!response.ok) {
    return { ok: false, error: readApiErrorMessage(data) };
  }

  if (!isSessionApiSuccess(data)) {
    return { ok: false, error: DEFAULT_SESSION_ERROR };
  }

  return {
    ok: true,
    videos: data.videos,
    underTarget: Boolean(data.underTarget),
  };
}