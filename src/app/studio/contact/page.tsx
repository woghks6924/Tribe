import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioSubNav } from "@/components/studio/studio-sub-nav";
import { StudioContactForm } from "@/components/studio/studio-contact-form";

export const metadata: Metadata = {
  title: "Contact — Tri.be Studio",
  description: "Tell us about your next campaign.",
};

export default function StudioContactPage() {
  return (
    <>
      <StudioSubNav />
      <div className="flex flex-col gap-10 px-6 py-16 md:px-14 md:py-20">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-extrabold tracking-[0.02em] uppercase md:text-4xl">
            Contact
          </h1>
          <p className="text-sm text-studio-fg/60">
            Brand name, a bit about the campaign, and we&apos;ll follow up.
          </p>
        </div>
        <Suspense fallback={null}>
          <StudioContactForm />
        </Suspense>
      </div>
    </>
  );
}
