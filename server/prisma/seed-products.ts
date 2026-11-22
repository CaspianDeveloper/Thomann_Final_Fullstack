import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";

type Raw = {
  id: number;
  name: string;
  category: string;
  cat_img: string;
  brand_img?: string;
  subcategory: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  characterics?: Record<string, string | number> | null;
  availability: string;
  rating: number;
  reviews_count: number;
  image: string;
  [key: `thumb_img_${number}`]: string | undefined;
};

const STOCK: Record<string, number> = {
  in_stock: 50,
  limited_stock: 5,
  digital_download: 999,
  special_order: 0,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  if ((await prisma.product.count()) > 0) {
    console.log("Products already exist, skipping.");
    return;
  }

  const raw = JSON.parse(
    readFileSync(join(process.cwd(), "prisma/data/products.json"), "utf-8"),
  ) as Raw[];
  raw.sort((a, b) => a.id - b.id);

  // hər kateqoriya üçün ən çox işlənən cat_img
  const imgCount = new Map<string, Map<string, number>>();

  for (const p of raw) {
    const m = imgCount.get(p.category) ?? new Map<string, number>();
    m.set(p.cat_img, (m.get(p.cat_img) ?? 0) + 1);
    imgCount.set(p.category, m);
  }

  const categoryIds = new Map<string, number>();

  for (const [name, counts] of imgCount) {
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const imageUrl = top?.[0] ?? null;
    const slug = slugify(name);
    const c = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, imageUrl },
    });

    categoryIds.set(name, c.id);
  }

  for (const p of raw) {
    const images = [
      ...new Set(
        [1, 2, 3, 4, 5, 6]
          .map((i) => p[`thumb_img_${i}`])
          .filter((u): u is string => Boolean(u)),
      ),
    ];

    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        brand: p.id === 15 ? "Thomann" : p.brand,
        subcategory: p.subcategory,
        price: Number(p.price.toFixed(2)),
        currency: p.currency,
        stock: STOCK[p.availability] ?? 0,
        rating: p.rating,
        reviewsCount: p.reviews_count,
        image: p.image,
        images,
        brandImg: p.brand_img ?? null,
        specs: p.characterics ?? {},
        categoryId: categoryIds.get(p.category)!,
      },
    });
  }
  console.log(
    `Seeded ${categoryIds.size} categories and ${raw.length} products`,
  );
}

main().finally(() => prisma.$disconnect());
