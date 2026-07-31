"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { updatePassword } from "@/lib/auth/updatePassword";

export function ResetPasswordForm() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase's client SDK auto-detects the recovery session from the
    // emailed link's URL fragment (detectSessionInUrl, on by default) and
    // fires PASSWORD_RECOVERY once it's established.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setSaving(true);
    try {
      await updatePassword({ password }, { supabase });
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Could not update password");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-[12px] rounded-xl bg-surface p-[28px] text-center">
        <h1 className="font-heading text-[20px] font-bold text-text-primary">Password updated</h1>
        <p className="text-[13px] text-text-secondary">Redirecting you to log in…</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-[12px] rounded-xl bg-surface p-[28px] text-center">
        <p className="text-[13px] text-text-secondary">
          Waiting for a valid reset link — make sure you opened this page from the link in your
          email.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-[16px] rounded-xl bg-surface p-[28px]"
    >
      <h1 className="font-heading text-[20px] font-bold text-text-primary">Set a new password</h1>
      <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
        New password
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
        />
      </label>
      <label className="flex flex-col gap-[6px] text-[13px] text-text-secondary">
        Confirm password
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-md border border-border bg-canvas px-[12px] py-[10px] text-[14px] text-text-primary outline-none focus:border-border-strong"
        />
      </label>
      {error && (
        <p className="text-[13px] text-accent" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-accent px-[16px] py-[10px] text-[14px] font-semibold text-canvas disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
