"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { uploadLargeFile } from "@/lib/supabase-browser";

const BUCKET = "studio-portfolio";

type PortfolioItem = {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl: string | null;
  category: string;
  sortOrder: number;
};

export function StudioPortfolioManager({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", BUCKET);
      formData.append("folder", "portfolio");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setImageUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoUploading(true);
    setError(null);
    try {
      const url = await uploadLargeFile(file, "portfolio", BUCKET);
      setVideoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !imageUrl || !category) {
      setError("Please fill in title, category, and upload a cover image.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/studio-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, imageUrl, videoUrl: videoUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add item.");
        return;
      }
      setTitle("");
      setCategory("");
      setImageUrl("");
      setVideoUrl("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function move(id: string, sortOrder: number, direction: -1 | 1) {
    const target = items.find((i) => i.sortOrder === sortOrder + direction);
    if (!target) return;
    await Promise.all([
      fetch(`/api/admin/studio-portfolio/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/admin/studio-portfolio/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder }),
      }),
    ]);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/studio-portfolio/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="flex items-center gap-4 border border-line px-4 py-3 text-sm"
          >
            <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden border border-line-strong bg-base-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
              {item.videoUrl && (
                <span className="absolute top-0.5 left-0.5 bg-base/80 px-1 text-[9px] text-ink-muted">
                  VIDEO
                </span>
              )}
            </div>
            <span className="flex-1 truncate">{item.title}</span>
            <span className="text-xs text-ink-faint">{item.category}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(item.id, item.sortOrder, -1)}
                disabled={i === 0}
                className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(item.id, item.sortOrder, 1)}
                disabled={i === items.length - 1}
                className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="border border-line px-4 py-6 text-sm text-ink-faint">
            No portfolio items yet.
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex max-w-md flex-col gap-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Add Portfolio Item</span>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <input
          placeholder="Category (e.g. 트랙 WOD, HYROX, VO2max, Run & Swim)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs text-ink-faint">Cover image</span>
          {imageUrl && (
            <div className="relative h-32 w-52 overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => imageInputRef.current?.click()}
            disabled={imageUploading}
            className="w-fit"
          >
            {imageUploading ? "Uploading..." : imageUrl ? "Replace Image" : "Upload Image"}
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-ink-faint">Video (optional)</span>
          {videoUrl && (
            <div className="relative h-32 w-52 overflow-hidden border border-line">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={videoUrl} controls muted className="h-full w-full object-cover" />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => videoInputRef.current?.click()}
            disabled={videoUploading}
            className="w-fit"
          >
            {videoUploading ? "Uploading..." : videoUrl ? "Replace Video" : "Upload Video"}
          </Button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="hidden"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" variant="outline" disabled={loading} className="w-fit">
          {loading ? "Adding..." : "Add Item"}
        </Button>
      </form>
    </div>
  );
}
