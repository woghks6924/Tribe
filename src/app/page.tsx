import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { BrandStory } from "@/components/home/brand-story";
import { CategoryGrid } from "@/components/home/category-grid";
import { VideoSlideshow } from "@/components/home/video-slideshow";
import { Crew } from "@/components/home/crew";
import { Newsletter } from "@/components/home/newsletter";
import { getFeaturedProducts, getCategories } from "@/lib/products";

export default async function Home() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(4),
    getCategories(),
  ]);

  return (
    <>
      <Hero />
      <NewArrivals products={products} />
      <BrandStory />
      <CategoryGrid categories={categories} />
      <VideoSlideshow />
      <Crew />
      <Newsletter />
    </>
  );
}
