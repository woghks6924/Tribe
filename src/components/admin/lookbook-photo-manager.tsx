"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type LookbookPhoto = {
  id: string;
  imageUrl: string;
  caption: string;
  active: boolean;
  sortOrder: number;
};

export function LookbookPhotoManager({ photos }: { photos: LookbookPhoto[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
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
    if (!imageUrl || !caption) {
      setError("Please upload an image and add a caption.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lookbook-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, caption }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add photo.");
        return;
      }
      setImageUrl("");
      setCaption("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/lookbook-photos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  async function move(id: string, sortOrder: number, direction: -1 | 1) {
    const target = photos.find((p) => p.sortOrder === sortOrder + direction);
    if (!target) return;
    await Promise.all([
      fetch(`/api/admin/lookbook-photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/admin/lookbook-photos/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder }),
      }),
    ]);
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/lookbook-photos/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="flex items-center gap-4 border border-line px-4 py-3 text-sm"
          >
            <div className="relative h-16 w-24 shrink-0 overflow-hidden border border-line-strong">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="flex-1 truncate text-ink-muted">{photo.caption}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => move(photo.id, photo.sortOrder, -1)}
                disabled={i === 0}
                className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(photo.id, photo.sortOrder, 1)}
                disabled={i === photos.length - 1}
                className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button
              onClick={() => toggleActive(photo.id, photo.active)}
              className={`cursor-pointer text-xs ${photo.active ? "text-ink" : "text-ink-faint"}`}
            >
              {photo.active ? "Active" : "Inactive"}
            </button>
            <button
              onClick={() => handleDelete(photo.id)}
              className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        {photos.length === 0 && (
          <p className="border border-line px-4 py-6 text-sm text-ink-faint">
            No lookbook photos yet.
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex max-w-md flex-col gap-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Add Photo</span>

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
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <input
          placeholder="Mood caption (e.g. Before the mile begins.)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" variant="outline" disabled={loading} className="w-fit">
          {loading ? "Adding..." : "Add Photo"}
        </Button>
      </form>
    </div>
  );
}
