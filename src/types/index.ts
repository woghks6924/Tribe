export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
};

export type ProductOptionData = {
  id: string;
  size: string;
  color: string;
  colorHex: string | null;
  stock: number;
  priceDiff: number;
};

export type ProductDetailData = ProductCardData & {
  description: string;
  images: { id: string; url: string; alt: string | null }[];
  options: ProductOptionData[];
};

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};
