"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { uploadLargeFile } from "@/lib/supabase-browser";

type BannerSlide = {
  id: string;
  mediaType: "VIDEO" | "IMAGE";
  mediaUrl: string;
  label: string | null;
  brightness: number;
  durationSec: number | null;
  active: boolean;
  sortOrder: number;
};

export function BannerSlideManager({ slides }: { slides: BannerSlide[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaType, setMediaType] = useState<"VIDEO" | "IMAGE">("VIDEO");
  const [mediaUrl, setMediaUrl] = useState("");
  const [label, setLabel] = useState("");
  const [brightness, setBrightness] = useState("1.3");
  const [durationSec, setDurationSec] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      if (mediaType === "VIDEO") {
        const url = await uploadLargeFile(file, "banners");
        setMediaUrl(url);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");
        setMediaUrl(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!mediaUrl) {
      setError("Please upload a video or photo first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/banner-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType,
          mediaUrl,
          label: label || undefined,
          brightness: Number(brightness) || 1.3,
          durationSec: durationSec ? Number(durationSec) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add slide.");
        return;
      }
      setMediaUrl("");
      setLabel("");
      setBrightness("1.3");
      setDurationSec("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/banner-slides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  async function move(id: string, sortOrder: number, direction: -1 | 1) {
    const target = slides.find((s) => s.sortOrder === sortOrder + direction);
    if (!target) return;
    await Promise.all([
      fetch(`/api/admin/banner-slides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/admin/banner-slides/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder }),
      }),
    ]);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/banner-slides/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function setDuration(id: string, value: string) {
    const parsed = value ? Number(value) : null;
    await fetch(`/api/admin/banner-slides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationSec: parsed }),
    });
    router.refresh();
  }

  async function moveToTop(id: string) {
    const minOrder = Math.min(...slides.map((s) => s.sortOrder));
    await fetch(`/api/admin/banner-slides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: minOrder - 1, active: true }),
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className="flex items-center gap-4 border border-line px-4 py-3 text-sm"
          >
            <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden border border-line-strong bg-base-elevated">
              {slide.mediaType === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.mediaUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={slide.mediaUrl} muted className="h-full w-full object-cover" />
              )}
              <span className="absolute top-0.5 left-0.5 bg-base/80 px-1 text-[9px] text-ink-muted">
                {slide.mediaType}
              </span>
            </div>
            <span className="flex-1 truncate text-ink-muted">{slide.label || "—"}</span>
            <label className="flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-ink-faint">
              <input
                type="number"
                min="1"
                defaultValue={slide.durationSec ?? ""}
                placeholder={slide.mediaType === "VIDEO" ? "auto" : "5"}
                onBlur={(e) => setDuration(slide.id, e.target.value)}
                className="w-12 border border-line-strong bg-transparent px-1.5 py-1 text-center text-ink outline-none"
              />
              sec
            </label>
            {i !== 0 && (
              <button
                onClick={() => moveToTop(slide.id)}
                className="cursor-pointer text-xs whitespace-nowrap text-ink-muted hover:text-ink"
              >
                Move to Top
              </button>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(slide.id, slide.sortOrder, -1)}
                disabled={i === 0}
                className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(slide.id, slide.sortOrder, 1)}
                disabled={i === slides.length - 1}
                className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button
              onClick={() => toggleActive(slide.id, slide.active)}
              className={`cursor-pointer text-xs ${slide.active ? "text-ink" : "text-ink-faint"}`}
            >
              {slide.active ? "Active" : "Inactive"}
            </button>
            <button
              onClick={() => handleDelete(slide.id)}
              className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        {slides.length === 0 && (
          <p className="border border-line px-4 py-6 text-sm text-ink-faint">
            No banner slides yet.
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex max-w-md flex-col gap-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Add Slide</span>

        <div className="flex gap-2">
          {(["VIDEO", "IMAGE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setMediaType(t);
                setMediaUrl("");
              }}
              className={`cursor-pointer border px-3 py-2 text-xs uppercase ${
                mediaType === t
                  ? "border-ink bg-ink text-base"
                  : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              {t === "VIDEO" ? "Video" : "Photo"}
            </button>
          ))}
        </div>

        {mediaUrl && (
          <div className="relative h-32 w-52 overflow-hidden border border-line">
            {mediaType === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={mediaUrl} controls muted className="h-full w-full object-cover" />
            )}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-fit"
        >
          {uploading
            ? "Uploading..."
            : mediaUrl
              ? "Replace File"
              : `Upload ${mediaType === "VIDEO" ? "Video" : "Photo"}`}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={mediaType === "VIDEO" ? "video/*" : "image/*"}
          onChange={handleFileUpload}
          className="hidden"
        />

        <input
          placeholder="Label (optional, e.g. SEOUL NIGHT LOOP)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
          Brightness ({brightness})
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.05"
            value={brightness}
            onChange={(e) => setBrightness(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs tracking-[0.08em] text-ink-muted uppercase">
          Duration in seconds (optional — video defaults to its own length, photo to 5s)
          <input
            type="number"
            min="1"
            placeholder="auto"
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm text-ink normal-case outline-none"
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" variant="outline" disabled={loading || !mediaUrl} className="w-fit">
          {loading ? "Adding..." : "Add Slide"}
        </Button>
      </form>
    </div>
  );
}
