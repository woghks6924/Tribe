"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/admin/rich-text-editor";

type ImageItem = { url: string; alt?: string };
type OptionItem = {
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  stock: number;
  priceDiff: number;
};

type Category = { id: string; name: string };

const STATUSES = ["DRAFT", "ACTIVE", "SOLD_OUT", "ARCHIVED"] as const;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductForm({
  categories,
  productId,
  initial,
}: {
  categories: Category[];
  productId?: string;
  initial?: {
    name: string;
    slug: string;
    description: string;
    infoContent?: string | null;
    sizeContent?: string | null;
    detailContent?: string | null;
    price: number;
    compareAtPrice: number | null;
    categoryId: string;
    status: (typeof STATUSES)[number];
    images: ImageItem[];
    options: OptionItem[];
  };
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [infoContent, setInfoContent] = useState(initial?.infoContent ?? "");
  const [sizeContent, setSizeContent] = useState(initial?.sizeContent ?? "");
  const [detailContent, setDetailContent] = useState(initial?.detailContent ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial?.compareAtPrice ? String(initial.compareAtPrice) : "",
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>(initial?.status ?? "ACTIVE");
  const [images, setImages] = useState<ImageItem[]>(initial?.images ?? []);
  const [options, setOptions] = useState<OptionItem[]>(
    initial?.options ?? [{ size: "", color: "", colorHex: "", sku: "", stock: 0, priceDiff: 0 }],
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      setImages((prev) => [...prev, { url: data.url, alt: name }]);
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateOption(index: number, patch: Partial<OptionItem>) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        slug,
        description,
        infoContent,
        sizeContent,
        detailContent,
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        categoryId,
        status,
        images,
        options: options
          .filter((o) => o.size && o.color && o.sku)
          .map((o) => ({ ...o, colorHex: o.colorHex || undefined })),
      };

      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save product.");
        setLoading(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-4">
        <input
          required
          placeholder="Product name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <input
          required
          placeholder="Slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <textarea
          required
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            type="number"
            placeholder="Price (KRW)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            type="number"
            placeholder="Compare-at price (optional)"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-line-strong bg-base px-4 py-3 text-sm outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
            className="border border-line-strong bg-base px-4 py-3 text-sm outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Images</span>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={img.url} className="relative h-24 w-24 overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 h-5 w-5 cursor-pointer bg-base/80 text-xs text-ink hover:bg-base"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="text-xs" />
        {uploading && <span className="text-xs text-ink-muted">Uploading...</span>}
      </div>

      <RichTextEditor label="Product Info" value={infoContent} onChange={setInfoContent} />
      <RichTextEditor label="Size Guide" value={sizeContent} onChange={setSizeContent} />
      <RichTextEditor
        label="Detail Content (lookbook / product shots)"
        value={detailContent}
        onChange={setDetailContent}
      />

      <div className="flex flex-col gap-3">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Options (Size / Color)</span>
        <div className="flex flex-col gap-2">
          {options.map((option, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2">
              <input
                placeholder="Size"
                value={option.size}
                onChange={(e) => updateOption(i, { size: e.target.value })}
                className="border border-line-strong bg-transparent px-2 py-2 text-xs outline-none placeholder:text-ink-faint"
              />
              <input
                placeholder="Color"
                value={option.color}
                onChange={(e) => updateOption(i, { color: e.target.value })}
                className="border border-line-strong bg-transparent px-2 py-2 text-xs outline-none placeholder:text-ink-faint"
              />
              <input
                placeholder="#hex"
                value={option.colorHex}
                onChange={(e) => updateOption(i, { colorHex: e.target.value })}
                className="border border-line-strong bg-transparent px-2 py-2 text-xs outline-none placeholder:text-ink-faint"
              />
              <input
                placeholder="SKU"
                value={option.sku}
                onChange={(e) => updateOption(i, { sku: e.target.value })}
                className="border border-line-strong bg-transparent px-2 py-2 text-xs outline-none placeholder:text-ink-faint"
              />
              <input
                type="number"
                placeholder="Stock"
                value={option.stock}
                onChange={(e) => updateOption(i, { stock: Number(e.target.value) })}
                className="border border-line-strong bg-transparent px-2 py-2 text-xs outline-none placeholder:text-ink-faint"
              />
              <input
                type="number"
                placeholder="+/- price"
                value={option.priceDiff}
                onChange={(e) => updateOption(i, { priceDiff: Number(e.target.value) })}
                className="border border-line-strong bg-transparent px-2 py-2 text-xs outline-none placeholder:text-ink-faint"
              />
              <button
                type="button"
                onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
                className="cursor-pointer px-2 text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setOptions((prev) => [
              ...prev,
              { size: "", color: "", colorHex: "", sku: "", stock: 0, priceDiff: 0 },
            ])
          }
          className="w-fit cursor-pointer border border-line-strong px-3 py-1.5 text-xs text-ink-muted hover:border-ink hover:text-ink"
        >
          + Add Option
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <Button type="submit" variant="primary" disabled={loading} className="w-fit">
        {loading ? "Saving..." : productId ? "Save Changes" : "Create Product"}
      </Button>
    </form>
  );
}
