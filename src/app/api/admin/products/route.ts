import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

type ProductInput = {
  name: string;
  slug: string;
  description: string;
  infoContent?: string;
  sizeContent?: string;
  detailContent?: string;
  price: number;
  compareAtPrice?: number | null;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "SOLD_OUT" | "ARCHIVED";
  images: { url: string; alt?: string }[];
  options: {
    size: string;
    color: string;
    colorHex?: string;
    sku: string;
    stock: number;
    priceDiff: number;
  }[];
};

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } }, images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      status: p.status,
      categoryName: p.category.name,
      imageUrl: p.images[0]?.url ?? null,
    })),
  );
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as ProductInput;

  if (!body.name || !body.slug || !body.categoryId || !body.price) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      infoContent: body.infoContent || null,
      sizeContent: body.sizeContent || null,
      detailContent: body.detailContent || null,
      price: body.price,
      compareAtPrice: body.compareAtPrice || null,
      categoryId: body.categoryId,
      status: body.status,
      images: {
        create: body.images.map((img, i) => ({ url: img.url, alt: img.alt, sortOrder: i })),
      },
      options: {
        create: body.options.map((o) => ({
          size: o.size,
          color: o.color,
          colorHex: o.colorHex || null,
          sku: o.sku,
          stock: o.stock,
          priceDiff: o.priceDiff,
        })),
      },
    },
  });

  return NextResponse.json({ id: product.id });
}
