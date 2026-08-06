import { LookbookHero } from "@/components/lookbook/lookbook-hero";
import { LookbookGrid } from "@/components/lookbook/lookbook-grid";
import { LookbookScroll } from "@/components/lookbook/lookbook-scroll";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function LookbookPage() {
  const products = await getProducts();

  return (
    <>
      <LookbookHero />
      <LookbookGrid products={products} />
      <LookbookScroll products={products} />
    </>
  );
}
