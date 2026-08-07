import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, functionalities] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.functionality.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">New Product</h1>
      <ProductForm categories={categories} functionalities={functionalities} />
    </div>
  );
}
