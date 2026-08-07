import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { BrandStory } from "@/components/home/brand-story";
import { CategoryGrid } from "@/components/home/category-grid";
import { Crew } from "@/components/home/crew";
import { Newsletter } from "@/components/home/newsletter";
import { getFeaturedProducts, getCategories } from "@/lib/products";
import { getActiveBannerSlides } from "@/lib/banner";
import { getHomeContent } from "@/lib/site-settings";

// DB에서 매번 최신 재고/가격을 읽어야 하므로 빌드 시점 정적 렌더링을 하지 않는다.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categories, bannerSlides, content] = await Promise.all([
    getFeaturedProducts(4),
    getCategories(),
    getActiveBannerSlides(),
    getHomeContent(),
  ]);

  return (
    <>
      <Hero
        slides={bannerSlides}
        badgeText={content.heroBadgeText}
        headline={content.heroHeadline}
        subtext={content.heroSubtext}
      />
      <NewArrivals products={products} />
      <BrandStory label={content.storyLabel} headline={content.storyHeadline} body={content.storyBody} />
      <CategoryGrid categories={categories} />
      <Crew
        label={content.crewLabel}
        headline={content.crewHeadline}
        body={content.crewBody}
        cta={content.crewCta}
      />
      <Newsletter headline={content.newsletterHeadline} body={content.newsletterBody} />
    </>
  );
}
