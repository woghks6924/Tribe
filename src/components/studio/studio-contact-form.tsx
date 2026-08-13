"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

const PACKAGES = ["Content Day", "Brand Content", "Mini Campaign", "Not sure yet"];

export function StudioContactForm() {
  const searchParams = useSearchParams();
  const presetPackage = searchParams.get("package");

  const [brandName, setBrandName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [packageInterest, setPackageInterest] = useState(
    presetPackage && PACKAGES.includes(presetPackage) ? presetPackage : "",
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/studio/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          contactName,
          contactInfo,
          packageInterest: packageInterest || undefined,
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex max-w-lg flex-col gap-2 border border-studio-line px-6 py-10 text-center">
        <span className="font-display text-xl font-extrabold tracking-[0.02em] uppercase">
          Thanks — we got it.
        </span>
        <p className="text-sm text-studio-fg/60">
          We&apos;ll follow up within a couple of business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-4">
      <input
        required
        placeholder="Brand name"
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
        className="border border-studio-line bg-transparent px-4 py-3 text-sm outline-none placeholder:text-studio-fg/40"
      />
      <input
        required
        placeholder="Your name"
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        className="border border-studio-line bg-transparent px-4 py-3 text-sm outline-none placeholder:text-studio-fg/40"
      />
      <input
        required
        placeholder="Email or phone"
        value={contactInfo}
        onChange={(e) => setContactInfo(e.target.value)}
        className="border border-studio-line bg-transparent px-4 py-3 text-sm outline-none placeholder:text-studio-fg/40"
      />
      <select
        value={packageInterest}
        onChange={(e) => setPackageInterest(e.target.value)}
        className="border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none"
      >
        <option value="">Package of interest (optional)</option>
        {PACKAGES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <textarea
        required
        placeholder="Tell us about the campaign"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        className="border border-studio-line bg-transparent px-4 py-3 text-sm outline-none placeholder:text-studio-fg/40"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer bg-studio-fg px-6 py-3 text-xs tracking-[0.1em] text-studio-bg uppercase hover:opacity-85 disabled:opacity-40"
      >
        {loading ? "Sending..." : "Send Inquiry"}
      </button>
    </form>
  );
}
