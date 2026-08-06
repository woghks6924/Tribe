"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="flex flex-col items-start gap-8 bg-base-elevated px-6 py-20 md:flex-row md:items-center md:justify-between md:px-14">
      <div className="flex max-w-md flex-col gap-3">
        <h2 className="font-display text-xl font-extrabold tracking-[0.02em] uppercase">
          Join the Tribe
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          Every Tuesday, get run club news and new product previews first.
        </p>
      </div>
      {submitted ? (
        <p className="text-sm text-ink-muted">Thanks for subscribing.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-0">
          <input
            type="email"
            required
            placeholder="Email address"
            className="flex-1 border-b border-line-strong bg-transparent px-1 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <Button type="submit" variant="outline" className="shrink-0 border-l-0">
            Subscribe
          </Button>
        </form>
      )}
    </section>
  );
}
