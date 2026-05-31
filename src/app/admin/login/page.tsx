"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const timedOut = params.get("timeout") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: username.trim(),
      password,
    });
    if (error) {
      setError("Incorrect username or password");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-dvh p-5 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">
          <span className="text-burnt">MR GYROS</span> Admin
        </h1>
        <p className="text-muted mb-6">Sign in to manage the time clock.</p>

        {timedOut && (
          <div className="border border-line text-muted px-3 py-2 mb-4">
            Session timed out after 8 hours. Sign in again.
          </div>
        )}
        {error && (
          <div className="border border-danger text-danger px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="email"
              autoComplete="username"
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={busy} className="btn btn-block">
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <a
          href="/"
          className="block mt-8 text-muted text-xs uppercase tracking-wide"
        >
          &larr; Clock-in screen
        </a>
      </div>
    </main>
  );
}

export default function AdminLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
