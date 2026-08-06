"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

export function SettingsForm({ initialContent }: { initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingReturnsContent: content }),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved." : "Failed to save.");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <p className="text-xs text-ink-muted">
        This content appears in the &quot;Shipping &amp; Returns&quot; tab on every product page.
      </p>
      <RichTextEditor label="Shipping & Returns" value={content} onChange={setContent} />
      {message && <p className="text-xs text-ink-muted">{message}</p>}
      <Button variant="primary" onClick={handleSave} disabled={saving} className="w-fit">
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
