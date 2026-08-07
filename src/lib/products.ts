import { prisma } from "@/lib/prisma";
import type {
  CategoryData,
  ProductCardData,
  ProductDetailData,
} from "@/types";

function toCard(product: {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  thumbnailUrl: string | null;
  category: { name: string; slug: string };
  images: { url: string; sortOrder: number }[];
}): ProductCardData {
  const cover = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)[0];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    imageUrl: product.thumbnailUrl ?? cover?.url ?? null,
  };
}

export async function getFeaturedProducts(limit = 4): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, sortOrder: true } },
    },
  });
  return products.map(toCard);
}

export async function getCategories(): Promise<CategoryData[]> {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
  }));
}

export async function getProducts(options?: {
  categorySlug?: string;
}): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      category: options?.categorySlug
        ? { slug: options.categorySlug }
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, sortOrder: true } },
    },
  });
  return products.map(toCard);
}

export async function getSaleProducts(): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", compareAtPrice: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, sortOrder: true } },
    },
  });
  return products.map(toCard);
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string,
  limit = 4,
): Promise<ProductCardData[]> {
  const sameCategory = await prisma.product.findMany({
    where: { status: "ACTIVE", id: { not: excludeId }, category: { slug: categorySlug } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, sortOrder: true } },
    },
  });

  if (sameCategory.length >= limit) return sameCategory.map(toCard);

  const fillers = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: [excludeId, ...sameCategory.map((p) => p.id)] },
    },
    orderBy: { createdAt: "desc" },
    take: limit - sameCategory.length,
    include: {
      category: { select: { name: true, slug: true } },
      images: { select: { url: true, sortOrder: true } },
    },
  });

  return [...sameCategory, ...fillers].map(toCard);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailData | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      options: true,
      functionalities: { include: { functionality: true } },
    },
  });
  if (!product) return null;

  return {
    ...toCard(product),
    description: product.description,
    infoContent: product.infoContent,
    sizeContent: product.sizeContent,
    detailContent: product.detailContent,
    images: product.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
    options: product.options.map((o) => ({
      id: o.id,
      size: o.size,
      color: o.color,
      colorHex: o.colorHex,
      stock: o.stock,
      priceDiff: o.priceDiff,
    })),
    fitType: product.fitType,
    pocketing: product.pocketing,
    tempMin: product.tempMin,
    tempMax: product.tempMax,
    effortMin: product.effortMin,
    effortMax: product.effortMax,
    materials: product.materials,
    careInstructions: product.careInstructions,
    careNote: product.careNote,
    madeIn: product.madeIn,
    purposeTags: product.purposeTags,
    functionalities: product.functionalities.map((pf) => ({
      id: pf.functionality.id,
      title: pf.functionality.title,
      description: pf.functionality.description,
      icon: pf.functionality.icon,
    })),
  };
}
