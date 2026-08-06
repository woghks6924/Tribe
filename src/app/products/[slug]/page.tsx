import { notFound } from "next/navigation";
import { ImageSlot } from "@/components/ui/image-slot";
import { ProductOptions } from "@/components/product/product-options";
import { ProductTabs } from "@/components/product/product-tabs";
import { RelatedProducts } from "@/components/product/related-products";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { getShippingReturnsContent } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, shippingReturnsContent] = await Promise.all([
    getProductBySlug(slug),
    getShippingReturnsContent(),
  ]);

  if (!product) notFound();

  const related = await getRelatedProducts(product.categorySlug, product.id);

  const gallery = product.images.length > 0 ? product.images : [null];

  const tabs = [
    product.infoContent && { label: "Product Info", html: product.infoContent },
    product.sizeContent && { label: "Size Guide", html: product.sizeContent },
    product.detailContent && { label: "Details", html: product.detailContent },
    shippingReturnsContent && { label: "Shipping & Returns", html: shippingReturnsContent },
  ].filter((t): t is { label: string; html: string } => !!t);

  return (
    <>
      <div className="flex flex-col gap-16 px-6 py-16 md:px-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-4">
            {gallery.map((image, i) => (
              <div key={image?.id ?? i} className="relative aspect-[4/5] w-full">
                <ImageSlot
                  src={image?.url}
                  alt={image?.alt ?? product.name}
                  placeholder="Product photo"
                  className="h-full w-full"
                />
              </div>
            ))}
          </div>

          <div className="md:sticky md:top-28 md:self-start">
            <ProductOptions product={product} />
          </div>
        </div>

        <ProductTabs tabs={tabs} />
      </div>

      <RelatedProducts products={related} />
    </>
  );
}
