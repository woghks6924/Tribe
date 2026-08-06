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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      options: true,
    },
  });

  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as ProductInput;

  const conflict = await prisma.product.findFirst({
    where: { slug: body.slug, NOT: { id } },
  });
  if (conflict) {
    return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.productOption.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
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
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
