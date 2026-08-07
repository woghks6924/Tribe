"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Functionality = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
};

export function FunctionalityManager({ functionalities }: { functionalities: Functionality[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setIcon(data.url);
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
    if (!title || !description) {
      setError("Please fill in title and description.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/functionalities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, icon: icon || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add.");
        return;
      }
      setTitle("");
      setDescription("");
      setIcon("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/functionalities/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {functionalities.map((f) => (
          <div key={f.id} className="flex flex-col gap-2 border border-line p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-base-elevated">
                {f.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.icon} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-ink-faint">{f.title.charAt(0)}</span>
                )}
              </div>
              <span className="text-sm font-semibold">{f.title}</span>
            </div>
            <p className="text-xs text-ink-muted">{f.description}</p>
            <button
              onClick={() => handleDelete(f.id)}
              className="w-fit cursor-pointer text-xs text-ink-faint hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        {functionalities.length === 0 && (
          <p className="col-span-full border border-line px-4 py-6 text-sm text-ink-faint">
            No functionality cards yet.
          </p>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex max-w-md flex-col gap-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Add Functionality</span>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-base-elevated">
            {icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Icon"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleIconUpload}
            className="hidden"
          />
        </div>

        <input
          placeholder="Title (e.g. Sweat-Wicking)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" variant="outline" disabled={loading} className="w-fit">
          {loading ? "Adding..." : "Add"}
        </Button>
      </form>
    </div>
  );
}
