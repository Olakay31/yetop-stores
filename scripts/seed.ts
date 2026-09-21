import "dotenv/config";
import { db } from "../lib/db";

const categories = [
  {
    name: "Herbs",
    slug: "herbs",
  },
  {
    name: "Tea",
    slug: "tea",
  },
  {
    name: "Soap",
    slug: "soap",
  },
  {
    name: "Cream",
    slug: "cream",
  },
  {
    name: "Powder",
    slug: "powder",
  },
  {
    name: "Spiritual Products",
    slug: "spiritual-products",
  },
];

const products = [
  {
    name: "Yetop Herbal Mixture",
    slug: "yetop-herbal-mixture",
    description: "Traditional herbal mixture supplied in wholesale quantities.",
    categorySlug: "herbs",
    isFeatured: true,
    unitName: "Carton",
    price: "25000",
    minOrderQty: 1,
    stockQuantity: 100,
  },
  {
    name: "Herbal Detox Tea",
    slug: "herbal-detox-tea",
    description: "Herbal tea product available for wholesale retailers.",
    categorySlug: "tea",
    isFeatured: true,
    unitName: "Carton",
    price: "18000",
    minOrderQty: 1,
    stockQuantity: 80,
  },
  {
    name: "African Black Soap",
    slug: "african-black-soap",
    description: "Wholesale African black soap for retailers.",
    categorySlug: "soap",
    isFeatured: false,
    unitName: "Carton",
    price: "22000",
    minOrderQty: 1,
    stockQuantity: 75,
  },
  {
    name: "Herbal Skin Cream",
    slug: "herbal-skin-cream",
    description: "Herbal skin cream supplied in wholesale quantities.",
    categorySlug: "cream",
    isFeatured: true,
    unitName: "Carton",
    price: "30000",
    minOrderQty: 1,
    stockQuantity: 60,
  },
  {
    name: "Herbal Powder",
    slug: "herbal-powder",
    description: "Finely processed herbal powder for wholesale distribution.",
    categorySlug: "powder",
    isFeatured: false,
    unitName: "Carton",
    price: "20000",
    minOrderQty: 1,
    stockQuantity: 90,
  },
  {
    name: "Spiritual Incense",
    slug: "spiritual-incense",
    description: "Wholesale spiritual incense product.",
    categorySlug: "spiritual-products",
    isFeatured: false,
    unitName: "Carton",
    price: "15000",
    minOrderQty: 1,
    stockQuantity: 50,
  },
];

async function main() {
  console.log("🌿 Starting Yetop seed...\n");

  const categoryMap = new Map<string, string>();

  // 1. Create/update categories
  for (const category of categories) {
    const existing = await db.orm.public.Category.upsert({
      create: {
        id: crypto.randomUUID(),
        name: category.name,
        slug: category.slug,
        isActive: true,
      },
      update: {
        name: category.name,
        isActive: true,
      },
      conflictOn: {
        slug: category.slug,
      },
    });

    categoryMap.set(category.slug, String(existing.id));

    console.log(`✅ Category: ${category.name}`);
  }

  // 2. Create/update products and their wholesale units
  for (const product of products) {
    const categoryId = categoryMap.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(
        `Category not found: ${product.categorySlug}`
      );
    }

    const existingProduct = await db.orm.public.Product.upsert({
      create: {
        id: crypto.randomUUID(),
        name: product.name,
        slug: product.slug,
        description: product.description,
        imageUrl: null,
        isActive: true,
        isFeatured: product.isFeatured,
        categoryId,
      },
      update: {
        name: product.name,
        description: product.description,
        isActive: true,
        isFeatured: product.isFeatured,
        categoryId,
      },
      conflictOn: {
        slug: product.slug,
      },
    });

    await db.orm.public.ProductUnit.upsert({
      create: {
        id: crypto.randomUUID(),
        unitName: product.unitName,
        price: product.price,
        minOrderQty: product.minOrderQty,
        stockQuantity: product.stockQuantity,
        reservedQty: 0,
        isActive: true,
        productId: existingProduct.id,
      },
      update: {
        price: product.price,
        minOrderQty: product.minOrderQty,
        stockQuantity: product.stockQuantity,
        isActive: true,
      },
      conflictOn: {
        productId: existingProduct.id,
        unitName: product.unitName,
      },
    });

    console.log(`✅ Product: ${product.name}`);
  }

  console.log("\n🎉 Yetop seed completed successfully!");
}

main().catch((error) => {
  console.error("\n❌ Seed failed:");
  console.error(error);
  process.exit(1);
});