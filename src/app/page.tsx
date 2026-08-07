import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { BrandStory } from "@/components/home/brand-story";
import { CategoryGrid } from "@/components/home/category-grid";
import { BannerSlideshow } from "@/components/home/banner-slideshow";
import { Crew } from "@/components/home/crew";
import { Newsletter } from "@/components/home/newsletter";
import { getFeaturedProducts, getCategories } from "@/lib/products";
import { getActiveBannerSlides } from "@/lib/banner";

// DB에서 매번 최신 재고/가격을 읽어야 하므로 빌드 시점 정적 렌더링을 하지 않는다.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categories, bannerSlides] = await Promise.all([
    getFeaturedProducts(4),
    getCategories(),
    getActiveBannerSlides(),
  ]);

  return (
    <>
      <Hero slide={bannerSlides[0] ?? null} />
      <NewArrivals products={products} />
      <BrandStory />
      <CategoryGrid categories={categories} />
      <BannerSlideshow slides={bannerSlides} />
      <Crew />
      <Newsletter />
    </>
  );
}
