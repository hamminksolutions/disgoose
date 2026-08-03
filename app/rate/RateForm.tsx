"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ListenMethod } from "@/lib/ratings/upsertRating";
import { RatingFields } from "../RatingFields";

type Album = {
  mbReleaseGroupId: string;
  title: string;
  artist: string;
  coverUrl: string | null;
};

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

        <RatingFields
          score={score}
          onScoreChange={setScore}
          listenMethod={listenMethod}
          onListenMethodChange={setListenMethod}
          owned={owned}
          onOwnedChange={setOwned}
          reviewText={reviewText}
          onReviewTextChange={setReviewText}
        />

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
