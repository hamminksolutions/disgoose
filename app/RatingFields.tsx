"use client";

import { useState } from "react";
import { isPhysicalListenMethod, type ListenMethod } from "@/lib/ratings/upsertRating";
import { LISTEN_METHODS } from "./ListenMethod";
import { OwnedCheckbox } from "./Owned";

const REVIEW_MAX_LENGTH = 2000;

function clampScore(value: number) {
  return Math.min(10, Math.max(1, Math.round(value * 10) / 10));
}

/**
 * Score/listen-method/owned/review editing block shared by the add (RateForm)
 * and edit (RatingModal) flows. The score input keeps its own display-text
 * state internally — only the committed `score` number crosses the prop
 * boundary — so callers can't reintroduce the controlled-input bug where
 * value={score.toFixed(1)} without a decoupled display state fights typing.
 */
export function RatingFields({
  score,
  onScoreChange,
  listenMethod,
  onListenMethodChange,
  owned,
  onOwnedChange,
  reviewText,
  onReviewTextChange,
}: {
  score: number;
  onScoreChange: (score: number) => void;
  listenMethod: ListenMethod;
  onListenMethodChange: (listenMethod: ListenMethod) => void;
  owned: boolean;
  onOwnedChange: (owned: boolean) => void;
  reviewText: string;
  onReviewTextChange: (reviewText: string) => void;
}) {
  const [scoreText, setScoreText] = useState(score.toFixed(1));

  function commitScore(next: number) {
    onScoreChange(next);
    setScoreText(next.toFixed(1));
  }

  return (
    <>
      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] text-text-secondary">Score</span>
        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            aria-label="Decrease score"
            onClick={() => commitScore(clampScore(score - 0.1))}
            className="h-[36px] w-[36px] rounded-md border border-border text-[16px] text-text-primary"
          >
            −
          </button>
          <input
            type="number"
            inputMode="decimal"
            step={0.1}
            min={1}
            max={10}
            value={scoreText}
            onChange={(e) => {
              setScoreText(e.target.value);
              const parsed = parseFloat(e.target.value);
              if (!Number.isNaN(parsed)) onScoreChange(clampScore(parsed));
            }}
            onBlur={() => setScoreText(score.toFixed(1))}
            className="w-[72px] rounded-md border border-border bg-canvas px-[10px] py-[8px] text-center text-[18px] font-bold text-text-primary"
          />
          <button
            type="button"
            aria-label="Increase score"
            onClick={() => commitScore(clampScore(score + 0.1))}
            className="h-[36px] w-[36px] rounded-md border border-border text-[16px] text-text-primary"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        <span className="text-[13px] text-text-secondary">Listen method</span>
        <div className="flex flex-wrap gap-[8px]">
          {LISTEN_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => {
                onListenMethodChange(method.value);
                if (!isPhysicalListenMethod(method.value)) onOwnedChange(false);
              }}
              className={`rounded-full border px-[14px] py-[7px] text-[13px] ${
                listenMethod === method.value
                  ? "border-accent bg-accent text-canvas"
                  : "border-border text-text-secondary"
              }`}
            >
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {isPhysicalListenMethod(listenMethod) && (
        <OwnedCheckbox checked={owned} onChange={onOwnedChange} />
      )}

      <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
        Review (optional)
        <textarea
          value={reviewText}
          maxLength={REVIEW_MAX_LENGTH}
          onChange={(e) => onReviewTextChange(e.target.value)}
          rows={5}
          className="resize-none rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
        />
        <span className="self-end text-[12px] text-text-muted">
          {reviewText.length}/{REVIEW_MAX_LENGTH}
        </span>
      </label>
    </>
  );
}
