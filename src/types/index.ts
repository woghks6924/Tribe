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

export type FunctionalityData = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
};

export type ProductDetailData = ProductCardData & {
  description: string;
  infoContent: string | null;
  sizeContent: string | null;
  detailContent: string | null;
  images: { id: string; url: string; alt: string | null }[];
  options: ProductOptionData[];
  fitType: string | null;
  pocketing: string | null;
  tempMin: number | null;
  tempMax: number | null;
  effortMin: number | null;
  effortMax: number | null;
  materials: string | null;
  careInstructions: string[];
  careNote: string | null;
  madeIn: string | null;
  purposeTags: string[];
  functionalities: FunctionalityData[];
};

export type CategoryData = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};
