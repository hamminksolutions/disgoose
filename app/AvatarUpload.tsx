"use client";

import { useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";
import { updateAvatarUrlAction } from "./settings/actions";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const AVATARS_BUCKET = "avatars";

/** Crops the loaded image to a centered square and re-encodes it as a JPEG blob, so every upload lands at a predictable path/content-type regardless of the source file's shape or format. */
async function cropToSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not process image");
  }
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, side, side);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))),
      "image/jpeg",
      0.9
    );
  });
}

export function AvatarUpload({
  userId,
  username,
  initialAvatarUrl,
}: {
  userId: string;
  username: string;
  initialAvatarUrl: string | null;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Avatar must be a JPEG, PNG, or WebP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Avatar must be 5MB or smaller");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const blob = await cropToSquareJpeg(file);
      // A fresh filename per upload (rather than a fixed name) means the
      // stored URL itself changes, so the browser never shows a stale
      // cached image at an old avatar's URL.
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);

      const result = await updateAvatarUrlAction(publicUrl);
      if (result.error) {
        throw new Error(result.error);
      }

      setAvatarUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload avatar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <p className="font-heading text-[16px] font-bold text-text-secondary">Avatar</p>
      <div className="flex items-center gap-[14px]">
        <Avatar avatarUrl={avatarUrl} username={username} size={72} />
        <div className="flex flex-col gap-[6px]">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-border px-[16px] py-[10px] text-[14px] font-semibold text-text-primary disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Change photo"}
          </button>
          <p className="text-[12px] text-text-muted">JPEG, PNG, or WebP. Max 5MB.</p>
          {error && <p className="text-[12px] text-accent">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
