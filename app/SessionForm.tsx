"use client";

import { useState, type FormEvent } from "react";
import type { Category } from "../src/videos";
import {
  CATEGORY_OPTIONS,
  MAX_BUDGET_MINUTES,
  MIN_BUDGET_MINUTES,
  UNDER_TARGET_MESSAGE,
  clampBudgetMinutes,
  clientValidationError,
  requestSession,
  selectedCategories,
} from "../src/session/sessionForm";
import type { SessionApiVideo } from "../src/session/sessionApi";

const DEFAULT_BUDGET_MINUTES = 30;

function emptyCategories(): Record<Category, boolean> {
  return CATEGORY_OPTIONS.reduce(
    (state, category) => {
      state[category] = false;
      return state;
    },
    {} as Record<Category, boolean>,
  );
}

export function SessionForm() {
  const [categories, setCategories] = useState(emptyCategories);
  const [budgetMinutes, setBudgetMinutes] = useState(DEFAULT_BUDGET_MINUTES);
  const [includeShorts, setIncludeShorts] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [videos, setVideos] = useState<SessionApiVideo[] | null>(null);
  const [loading, setLoading] = useState(false);

  const updateBudget = (value: number) => {
    setBudgetMinutes(clampBudgetMinutes(value));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setVideos(null);

    const picked = selectedCategories(categories);
    const clientError = clientValidationError(picked);
    if (clientError) {
      setMessage(clientError);
      return;
    }

    setLoading(true);
    const result = await requestSession({
      categories: picked,
      budgetMinutes,
      includeShorts,
    });
    setLoading(false);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setVideos(result.videos);
    if (result.underTarget) {
      setMessage(UNDER_TARGET_MESSAGE);
    }
  };

  return (
    <form className="session-form" onSubmit={onSubmit} aria-labelledby="build-session-heading">
      <h2 id="build-session-heading">Build your session</h2>

      <fieldset className="session-fieldset">
        <legend>Categories</legend>
        {CATEGORY_OPTIONS.map((category) => (
          <label key={category} className="session-check">
            <input
              type="checkbox"
              name="category"
              value={category}
              checked={categories[category]}
              onChange={(event) =>
                setCategories((prev) => ({
                  ...prev,
                  [category]: event.target.checked,
                }))
              }
            />
            {category}
          </label>
        ))}
      </fieldset>

      <div className="session-budget">
        <label htmlFor="budget-minutes">Time budget (minutes)</label>
        <div className="session-budget-controls">
          <input
            id="budget-minutes"
            type="number"
            min={MIN_BUDGET_MINUTES}
            max={MAX_BUDGET_MINUTES}
            step={1}
            value={budgetMinutes}
            onChange={(event) => updateBudget(Number(event.target.value))}
          />
          <input
            id="budget-slider"
            type="range"
            min={MIN_BUDGET_MINUTES}
            max={MAX_BUDGET_MINUTES}
            step={1}
            value={budgetMinutes}
            aria-labelledby="budget-minutes"
            onChange={(event) => updateBudget(Number(event.target.value))}
          />
        </div>
      </div>

      <label className="session-check">
        <input
          type="checkbox"
          name="includeShorts"
          checked={includeShorts}
          onChange={(event) => setIncludeShorts(event.target.checked)}
        />
        Include Shorts
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Building…" : "Build session"}
      </button>

      {message ? (
        <p className="session-message" role="alert">
          {message}
        </p>
      ) : null}

      {videos && videos.length > 0 ? (
        <p className="session-summary" aria-live="polite">
          Session ready: {videos.length} video{videos.length === 1 ? "" : "s"} lined up.
        </p>
      ) : null}
    </form>
  );
}