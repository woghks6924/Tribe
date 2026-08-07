import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, functionalities] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        options: true,
        functionalities: { select: { functionalityId: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.functionality.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Edit Product</h1>
      <ProductForm
        categories={categories}
        functionalities={functionalities}
        productId={product.id}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          infoContent: product.infoContent,
          sizeContent: product.sizeContent,
          detailContent: product.detailContent,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          categoryId: product.categoryId,
          status: product.status,
          images: product.images.map((img) => ({ url: img.url, alt: img.alt ?? undefined })),
          options: product.options.map((o) => ({
            size: o.size,
            color: o.color,
            colorHex: o.colorHex ?? "",
            sku: o.sku,
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
          functionalityIds: product.functionalities.map((f) => f.functionalityId),
        }}
      />
    </div>
  );
}
