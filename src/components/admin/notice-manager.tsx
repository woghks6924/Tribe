"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type Notice = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  linkUrl: string | null;
  popupEnabled: boolean;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
};

export function NoticeManager({ notices }: { notices: Notice[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setImageUrl(data.url);
      else setError(data.error ?? "Image upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !content) {
      setError("Please fill in title and content.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          imageUrl: imageUrl || undefined,
          linkUrl: linkUrl || undefined,
          popupEnabled,
          startAt: startAt || undefined,
          endAt: endAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create notice.");
        return;
      }
      setTitle("");
      setContent("");
      setImageUrl("");
      setLinkUrl("");
      setPopupEnabled(true);
      setStartAt("");
      setEndAt("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/notices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  async function togglePopup(id: string, popupEnabled: boolean) {
    await fetch(`/api/admin/notices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ popupEnabled: !popupEnabled }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col border border-line">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-line bg-base-elevated px-4 py-3 text-xs tracking-[0.08em] text-ink-muted uppercase">
          <span>Title</span>
          <span>Period</span>
          <span>Popup</span>
          <span>Status</span>
          <span></span>
        </div>
        {notices.map((n) => (
          <div
            key={n.id}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-line px-4 py-3 text-sm last:border-b-0"
          >
            <span>{n.title}</span>
            <span className="text-xs text-ink-faint">
              {n.startAt ? new Date(n.startAt).toLocaleDateString() : "—"}
              {" ~ "}
              {n.endAt ? new Date(n.endAt).toLocaleDateString() : "—"}
            </span>
            <button
              onClick={() => togglePopup(n.id, n.popupEnabled)}
              className={`cursor-pointer text-xs ${n.popupEnabled ? "text-ink" : "text-ink-faint"}`}
            >
              {n.popupEnabled ? "Popup On" : "Popup Off"}
            </button>
            <button
              onClick={() => toggleActive(n.id, n.active)}
              className={`cursor-pointer text-xs ${n.active ? "text-ink" : "text-ink-faint"}`}
            >
              {n.active ? "Active" : "Inactive"}
            </button>
            <button
              onClick={() => handleDelete(n.id)}
              className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        {notices.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-faint">No notices yet.</p>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex max-w-xl flex-col gap-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">New Notice</span>
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />

        <RichTextEditor label="Content" value={content} onChange={setContent} />

        <div className="flex flex-col gap-3">
          <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Image (optional)</span>
          {imageUrl && (
            <div className="relative h-32 w-52 overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : imageUrl ? "Replace Image" : "Upload Image"}
            </Button>
            {imageUrl && (
              <Button type="button" variant="outline" onClick={() => setImageUrl("")}>
                Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <input
          placeholder="Link URL (optional, e.g. /products/some-item)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
            Start Date
            <input
              type="date"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="border border-line-strong bg-base px-4 py-3 text-sm text-ink normal-case outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
            End Date
            <input
              type="date"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="border border-line-strong bg-base px-4 py-3 text-sm text-ink normal-case outline-none"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={popupEnabled}
            onChange={(e) => setPopupEnabled(e.target.checked)}
          />
          Show as popup on site entry
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" variant="outline" disabled={loading} className="w-fit">
          {loading ? "Adding..." : "Add Notice"}
        </Button>
      </form>
    </div>
  );
}
