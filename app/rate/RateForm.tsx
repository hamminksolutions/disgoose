"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isPhysicalListenMethod, type ListenMethod } from "@/lib/ratings/upsertRating";
import { OwnedCheckbox } from "../Owned";

type Album = {
  mbReleaseGroupId: string;
  title: string;
  artist: string;
  coverUrl: string | null;
};

const LISTEN_METHODS: { value: ListenMethod; label: string }[] = [
  { value: "spotify", label: "Spotify" },
  { value: "cd", label: "CD" },
  { value: "vinyl", label: "Vinyl" },
  { value: "streaming_other", label: "Other streaming" },
  { value: "other", label: "Other" },
];

const REVIEW_MAX_LENGTH = 2000;

function clampScore(value: number) {
  return Math.min(10, Math.max(1, Math.round(value * 10) / 10));
}

export function RateForm() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [results, setResults] = useState<Album[] | null>(null);

  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [score, setScore] = useState(5);
  const [listenMethod, setListenMethod] = useState<ListenMethod>("spotify");
  const [owned, setOwned] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function runSearch(q: string) {
    setIsSearching(true);
    setSearchFailed(false);
    try {
      const res = await fetch(`/api/albums/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        setSearchFailed(true);
        setResults(null);
        return;
      }
      const body = await res.json();
      setResults(body.albums as Album[]);
    } catch {
      setSearchFailed(true);
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSave() {
    if (!selectedAlbum) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mbReleaseGroupId: selectedAlbum.mbReleaseGroupId,
          score: Math.round(score * 10),
          listenMethod,
          owned,
          reviewText: reviewText.length > 0 ? reviewText : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSaveError(body?.error ?? "Could not save rating");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setSaveError("Could not save rating");
    } finally {
      setSaving(false);
    }
  }

  if (selectedAlbum) {
    return (
      <div className="flex flex-col gap-[16px]">
        <button
          type="button"
          onClick={() => setSelectedAlbum(null)}
          className="self-start text-[13px] text-text-muted"
        >
          ← Back to search
        </button>

        <div className="flex gap-[12px] rounded-lg bg-surface p-[12px]">
          <div className="aspect-square w-[64px] shrink-0 overflow-hidden rounded-md bg-surface-raised">
            {selectedAlbum.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedAlbum.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div>
            <p className="font-heading text-[15px] font-semibold text-text-primary">
              {selectedAlbum.title}
            </p>
            <p className="text-[13px] text-text-secondary">{selectedAlbum.artist}</p>
          </div>
        </div>

        <div className="flex flex-col gap-[8px]">
          <span className="text-[13px] text-text-secondary">Score</span>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              aria-label="Decrease score"
              onClick={() => setScore((s) => clampScore(s - 0.1))}
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
              value={score.toFixed(1)}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                if (!Number.isNaN(parsed)) setScore(clampScore(parsed));
              }}
              className="w-[72px] rounded-md border border-border bg-canvas px-[10px] py-[8px] text-center text-[18px] font-bold text-text-primary"
            />
            <button
              type="button"
              aria-label="Increase score"
              onClick={() => setScore((s) => clampScore(s + 0.1))}
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
                  setListenMethod(method.value);
                  if (!isPhysicalListenMethod(method.value)) setOwned(false);
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

        {isPhysicalListenMethod(listenMethod) && <OwnedCheckbox checked={owned} onChange={setOwned} />}

        <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
          Review (optional)
          <textarea
            value={reviewText}
            maxLength={REVIEW_MAX_LENGTH}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
            className="resize-none rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
          />
          <span className="self-end text-[12px] text-text-muted">
            {reviewText.length}/{REVIEW_MAX_LENGTH}
          </span>
        </label>

        {saveError && (
          <p className="text-[13px] text-accent" role="alert">
            {saveError}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-accent px-[16px] py-[10px] text-[14px] font-semibold text-canvas disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save rating"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[14px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length > 0) runSearch(query.trim());
        }}
        className="flex gap-[8px]"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an album…"
          className="flex-1 rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-[16px] py-[10px] text-[14px] font-semibold text-canvas"
        >
          Search
        </button>
      </form>

      {isSearching && <p className="text-[13px] text-text-muted">Searching…</p>}

      {searchFailed && (
        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-[12px] py-[10px]">
          <p className="text-[13px] text-text-secondary">Couldn&apos;t search right now.</p>
          <button
            type="button"
            onClick={() => runSearch(query.trim())}
            className="text-[13px] text-accent"
          >
            Retry
          </button>
        </div>
      )}

      {!isSearching && !searchFailed && results !== null && results.length === 0 && (
        <p className="text-[13px] text-text-muted">No albums found for &quot;{query}&quot;.</p>
      )}

      {!isSearching && results && results.length > 0 && (
        <ul className="flex flex-col gap-[8px]">
          {results.map((album) => (
            <li key={album.mbReleaseGroupId}>
              <button
                type="button"
                onClick={() => setSelectedAlbum(album)}
                className="flex w-full items-center gap-[12px] rounded-lg bg-surface p-[10px] text-left hover:bg-surface-raised"
              >
                <div className="aspect-square w-[44px] shrink-0 overflow-hidden rounded-md bg-surface-raised">
                  {album.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.coverUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-[14px] text-text-primary">{album.title}</p>
                  <p className="text-[12.5px] text-text-secondary">{album.artist}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
