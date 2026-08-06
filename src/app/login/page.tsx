"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NaverLoginButton } from "@/components/auth/naver-login-button";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  naver_state: "The login request expired. Please try again.",
  naver_no_email: "Naver didn't share an email address, so we can't create an account.",
  naver_failed: "Naver login failed. Please try again.",
};

function OAuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  if (!error) return null;
  return (
    <p className="text-xs text-red-400">
      {OAUTH_ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to log in.");
        setLoading(false);
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Log In</h1>

        <Suspense fallback={null}>
          <OAuthError />
        </Suspense>

        <NaverLoginButton />

        <div className="flex items-center gap-4 text-[10px] tracking-[0.1em] text-ink-faint uppercase">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <p className="text-center text-xs text-ink-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-ink hover:opacity-70">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
