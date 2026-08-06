"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NaverLoginButton } from "@/components/auth/naver-login-button";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create account.");
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
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Create Account</h1>

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
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            placeholder="Phone number (optional)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            required
            type="password"
            placeholder="Password (min. 8 characters)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            required
            type="password"
            placeholder="Confirm password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <p className="text-center text-xs text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-ink hover:opacity-70">
            Log in
          </Link>
        </p>
      </form>
      </div>
    </div>
  );
}
