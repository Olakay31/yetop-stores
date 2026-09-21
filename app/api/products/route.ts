import { db } from "@/lib/db";

export async function GET() {
  try {
    const products = await db.orm.public.Product.all();
    const categories = await db.orm.public.Category.all();
    const units = await db.orm.public.ProductUnit.all();

    const catalog = products.map((product) => {
      const category = categories.find(
        (item) => String(item.id) === String(product.categoryId)
      );

      const productUnits = units.filter(
        (unit) => String(unit.productId) === String(product.id)
      );

      return {
        ...product,
        category: category
          ? {
              id: category.id,
              name: category.name,
              slug: category.slug,
            }
          : null,
        units: productUnits,
      };
    });

    return Response.json({
      success: true,
      products: catalog,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}