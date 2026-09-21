import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.orm.public.Category.all();

    return Response.json({
      success: true,
      message: "Database connection successful",
      categories,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return Response.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}