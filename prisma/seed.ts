import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "T-Shirts", slug: "tshirts", sortOrder: 1 },
  { name: "Shorts", slug: "shorts", sortOrder: 2 },
  { name: "Outerwear", slug: "outer", sortOrder: 3 },
  { name: "Accessories", slug: "accessories", sortOrder: 4 },
] as const;

const SIZES = ["S", "M", "L", "XL"];
const COLORWAYS = [
  { color: "Black", colorHex: "#121316" },
  { color: "Charcoal", colorHex: "#3a3d43" },
  { color: "Sand", colorHex: "#c9c4ba" },
];

const PRODUCTS: {
  name: string;
  slug: string;
  category: (typeof CATEGORIES)[number]["slug"];
  price: number;
  compareAtPrice?: number;
  description: string;
}[] = [
  {
    name: "Night Loop Tech Tee",
    slug: "night-loop-tech-tee",
    category: "tshirts",
    price: 49000,
    description: "Moisture-wicking tech tee built for night runs, with reflective print for visibility.",
  },
  {
    name: "Pulse Graphic Tee",
    slug: "pulse-graphic-tee",
    category: "tshirts",
    price: 42000,
    compareAtPrice: 52000,
    description: "Cotton-blend tee featuring the Tri.be signature graphic.",
  },
  {
    name: "Street Pulse Shorts",
    slug: "street-pulse-shorts",
    category: "shorts",
    price: 58000,
    description: "Lined 5-inch running shorts with side pockets and a zip back pocket.",
  },
  {
    name: "Loop Split Shorts",
    slug: "loop-split-shorts",
    category: "shorts",
    price: 54000,
    description: "Lightweight running shorts with a side-split hem that never breaks your stride.",
  },
  {
    name: "Midnight Runner Jacket",
    slug: "midnight-runner-jacket",
    category: "outer",
    price: 128000,
    description: "Water-repellent shell jacket for night runs, with reflective detailing on the back panel.",
  },
  {
    name: "Grain Windbreaker",
    slug: "grain-windbreaker",
    category: "outer",
    price: 98000,
    compareAtPrice: 118000,
    description: "Ultra-lightweight packable windbreaker, easy to stash mid-run.",
  },
  {
    name: "Tribe Running Cap",
    slug: "tribe-running-cap",
    category: "accessories",
    price: 32000,
    description: "Running cap with a mesh panel for sweat ventilation.",
  },
  {
    name: "Pulse Armband",
    slug: "pulse-armband",
    category: "accessories",
    price: 24000,
    description: "Reflective armband with a phone pocket.",
  },
];

async function main() {
  const categoryIdBySlug = new Map<string, string>();

  for (const category of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder: category.sortOrder },
      create: category,
    });
    categoryIdBySlug.set(category.slug, created.id);
  }

  for (const [index, product] of PRODUCTS.entries()) {
    const categoryId = categoryIdBySlug.get(product.category)!;

    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        description: product.description,
        categoryId,
      },
      create: {
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        description: product.description,
        categoryId,
        status: "ACTIVE",
      },
    });

    for (const size of SIZES) {
      for (const colorway of COLORWAYS) {
        const sku = `${product.slug}-${size}-${colorway.color}`.toUpperCase();
        await prisma.productOption.upsert({
          where: { sku },
          update: { stock: 20 },
          create: {
            productId: created.id,
            size,
            color: colorway.color,
            colorHex: colorway.colorHex,
            sku,
            stock: 20,
          },
        });
      }
    }

    // createdAt 순서를 다르게 해 신제품 그리드에 최근 등록 순서가 반영되도록 한다.
    await prisma.product.update({
      where: { id: created.id },
      data: { createdAt: new Date(Date.now() - index * 1000 * 60 * 60) },
    });
  }

  console.log(`Seed complete: ${CATEGORIES.length} categories, ${PRODUCTS.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
