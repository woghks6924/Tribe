"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type SettingsData = {
  shippingReturnsContent: string;
  heroBadgeText: string;
  heroHeadline: string;
  heroSubtext: string;
  storyLabel: string;
  storyHeadline: string;
  storyBody: string;
  crewLabel: string;
  crewHeadline: string;
  crewBody: string;
  crewCta: string;
  newsletterHeadline: string;
  newsletterBody: string;
  showStudioTab: boolean;
  studioTheme: "LIGHT" | "DARK";
  studioHeroHeadline: string;
};

export function SettingsForm({ initial }: { initial: SettingsData }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved." : "Failed to save.");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">Hero</h2>
        <TextField label="Badge Text" value={form.heroBadgeText} onChange={(v) => set("heroBadgeText", v)} />
        <TextAreaField
          label="Headline (line break = new line)"
          value={form.heroHeadline}
          onChange={(v) => set("heroHeadline", v)}
          rows={2}
        />
        <TextAreaField label="Subtext" value={form.heroSubtext} onChange={(v) => set("heroSubtext", v)} rows={3} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">Brand Story</h2>
        <TextField label="Label" value={form.storyLabel} onChange={(v) => set("storyLabel", v)} />
        <TextAreaField
          label="Headline (line break = new line)"
          value={form.storyHeadline}
          onChange={(v) => set("storyHeadline", v)}
          rows={2}
        />
        <TextAreaField label="Body" value={form.storyBody} onChange={(v) => set("storyBody", v)} rows={3} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">Crew</h2>
        <TextField label="Label" value={form.crewLabel} onChange={(v) => set("crewLabel", v)} />
        <TextAreaField
          label="Headline (line break = new line)"
          value={form.crewHeadline}
          onChange={(v) => set("crewHeadline", v)}
          rows={2}
        />
        <TextAreaField label="Body" value={form.crewBody} onChange={(v) => set("crewBody", v)} rows={3} />
        <TextField label="Button Text" value={form.crewCta} onChange={(v) => set("crewCta", v)} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">Newsletter</h2>
        <TextField
          label="Headline"
          value={form.newsletterHeadline}
          onChange={(v) => set("newsletterHeadline", v)}
        />
        <TextAreaField label="Body" value={form.newsletterBody} onChange={(v) => set("newsletterBody", v)} rows={2} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">Studio</h2>
        <p className="text-xs text-ink-muted">
          Content production service pitch, separate from the shop — direction isn&apos;t final
          yet, so it&apos;s hidden by default.
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={form.showStudioTab}
            onChange={(e) => set("showStudioTab", e.target.checked)}
          />
          Show STUDIO tab in navigation (unchecked = /studio pages 404)
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Theme</span>
          <div className="flex gap-4">
            {(["LIGHT", "DARK"] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 text-sm text-ink-muted">
                <input
                  type="radio"
                  name="studioTheme"
                  checked={form.studioTheme === t}
                  onChange={() => set("studioTheme", t)}
                />
                {t === "LIGHT" ? "Light" : "Dark"}
              </label>
            ))}
          </div>
          <span className="text-xs text-ink-faint">
            Applies the same way for every visitor — not based on their browser/OS setting.
          </span>
        </div>
        <TextAreaField
          label="Hero Headline"
          value={form.studioHeroHeadline}
          onChange={(v) => set("studioHeroHeadline", v)}
          rows={2}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">Shipping & Returns</h2>
        <p className="text-xs text-ink-muted">
          Shown in the &quot;Shipping &amp; Returns&quot; tab on every product page.
        </p>
        <RichTextEditor
          label="Content"
          value={form.shippingReturnsContent}
          onChange={(v) => set("shippingReturnsContent", v)}
        />
      </section>

      {message && <p className="text-xs text-ink-muted">{message}</p>}
      <Button variant="primary" onClick={handleSave} disabled={saving} className="w-fit">
        {saving ? "Saving..." : "Save All"}
      </Button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none"
      />
    </label>
  );
}
