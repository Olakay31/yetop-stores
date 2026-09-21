"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  useCart,
  Product,
} from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import Footer from "../components/Footer";

const categories = [
  "All Products",
  "Herbs",
  "Tea",
  "Soap",
  "Cream",
  "Powder",
  "Spiritual Products",
];

type ApiProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  units: {
    id: string;
    unitName: string;
    price: string;
    minOrderQty: number;
    stockQuantity: number;
    reservedQty: number;
    isActive: boolean;
  }[];
};

export default function ProductsPage() {
  const {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    totalItems,
    orderTotal,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [productError, setProductError] =
    useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoadingProducts(true);
        setProductError(null);

        const response = await fetch("/api/products");

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data: {
          success: boolean;
          products: ApiProduct[];
        } = await response.json();

        if (!data.success) {
          throw new Error("Failed to load products");
        }

        const catalogProducts: Product[] =
          data.products
            .filter((product) => product.isActive)
            .flatMap((product) => {
              const activeUnits =
                product.units.filter(
                  (unit) =>
                    unit.isActive &&
                    unit.stockQuantity -
                      unit.reservedQty >
                      0
                );

              return activeUnits.map((unit) => ({
                id: `${product.id}-${unit.id}`,
                name: product.name,
                category:
                  product.category?.name ??
                  "Uncategorized",
                price: Number(unit.price),
                unit: unit.unitName,
                image:
                  product.imageUrl ?? "🌿",
                description:
                  product.description ??
                  undefined,
                minOrderQty:
                  unit.minOrderQty,
                stockQuantity:
                  unit.stockQuantity -
                  unit.reservedQty,
              }));
            });

        setProducts(catalogProducts);
      } catch (error) {
        console.error(
          "Failed to load products:",
          error
        );

        setProductError(
          "Unable to load products. Please try again."
        );
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts =
    selectedCategory === null ||
    selectedCategory === "All Products"
      ? products
      : products.filter(
          (product) =>
            product.category === selectedCategory
        );

  const addToOrder = (
    product: Product,
    quantity: number
  ) => {
    addToCart(product, quantity);
    setShowCart(true);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF7]">

      {/* Shared Header */}
      <Header
        cartCount={totalItems}
        onCartClick={() =>
          setShowCart(true)
        }
      />

      {/* Introduction */}
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-12">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
            Wholesale Catalogue
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-[#1F2937] md:text-5xl">
            Quality products for your retail business.
          </h1>

          <p className="mt-5 text-lg leading-8 text-gray-600">
            Browse our wholesale products, choose your
            quantities and add everything you need to your
            order.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() =>
                setSelectedCategory(
                  category === "All Products"
                    ? "All Products"
                    : category
                )
              }
              className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "bg-[#14532D] text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-[#14532D] hover:text-[#14532D]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Products */}
      {selectedCategory && (
        <section className="mx-auto max-w-7xl px-6 pb-20">

          {/* Back to Categories */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                Products
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#1F2937]">
                {selectedCategory}
              </h2>
            </div>

            <button
              onClick={() =>
                setSelectedCategory(null)
              }
              className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-[#14532D] hover:text-[#14532D]"
            >
              ← All Categories
            </button>
          </div>

          {/* Loading State */}
          {loadingProducts && (
            <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center">
              <div className="text-4xl">
                🌿
              </div>

              <h3 className="mt-4 text-xl font-bold text-[#1F2937]">
                Loading products...
              </h3>

              <p className="mt-2 text-gray-500">
                Please wait while we load our wholesale
                catalogue.
              </p>
            </div>
          )}

          {/* Error State */}
          {!loadingProducts &&
            productError && (
              <div className="rounded-2xl border border-red-100 bg-white px-6 py-12 text-center">
                <div className="text-4xl">
                  ⚠️
                </div>

                <h3 className="mt-4 text-xl font-bold text-[#1F2937]">
                  Unable to load products
                </h3>

                <p className="mt-2 text-gray-500">
                  {productError}
                </p>

                <button
                  onClick={() =>
                    window.location.reload()
                  }
                  className="mt-6 rounded-full bg-[#14532D] px-6 py-3 font-semibold text-white transition hover:bg-[#0f3d21]"
                >
                  Try Again
                </button>
              </div>
            )}

          {/* Empty State */}
          {!loadingProducts &&
            !productError &&
            filteredProducts.length === 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center">
                <div className="text-5xl">
                  🌿
                </div>

                <h3 className="mt-4 text-xl font-bold text-[#1F2937]">
                  No products available
                </h3>

                <p className="mt-2 text-gray-500">
                  There are currently no products available
                  in this category.
                </p>
              </div>
            )}

          {/* Product Grid */}
          {!loadingProducts &&
            !productError &&
            filteredProducts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToOrder={
                        addToOrder
                      }
                    />
                  )
                )}
              </div>
            )}
        </section>
      )}

      {/* Bottom CTA */}
      <section className="bg-[#14532D] px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to stock your store?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-green-100">
            Add your products to the order and submit your
            request to Yetop.
          </p>

          <button
            onClick={() =>
              setShowCart(true)
            }
            className="mt-8 rounded-full bg-white px-7 py-4 font-semibold text-[#14532D] hover:bg-gray-100"
          >
            Review My Order
          </button>
        </div>
      </section>

      {/* Cart Overlay */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() =>
            setShowCart(false)
          }
        >
          <div
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* Cart Header */}
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">
                  My Order
                </h2>

                <p className="text-sm text-gray-500">
                  {totalItems} item
                  {totalItems !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <button
                onClick={() =>
                  setShowCart(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl transition hover:bg-gray-200"
                aria-label="Close order"
              >
                ×
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="text-6xl">
                    🛒
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    Your order is empty
                  </h3>

                  <p className="mt-2 text-gray-500">
                    Add products from our catalogue to get
                    started.
                  </p>

                  <button
                    onClick={() =>
                      setShowCart(false)
                    }
                    className="mt-6 rounded-full bg-[#14532D] px-6 py-3 font-semibold text-white transition hover:bg-[#0f3d21]"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cart.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-gray-100 p-4"
                      >
                        <div className="flex gap-4">

                          {/* Product Image */}
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-green-50 text-3xl">
                            {item.image}
                          </div>

                          {/* Product Details */}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-800">
                              {item.name}
                            </h3>

                            <p className="text-sm text-gray-500">
                              ₦
                              {item.price.toLocaleString()}{" "}
                              / {item.unit}
                            </p>

                            {/* Quantity Controls */}
                            <div className="mt-3 flex items-center justify-between">

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity -
                                        1
                                    )
                                  }
                                  disabled={
                                    item.quantity <=
                                    item.minOrderQty
                                  }
                                  className="h-8 w-8 rounded-lg bg-gray-100 font-bold transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Decrease ${item.name} quantity`}
                                >
                                  −
                                </button>

                                <span className="font-bold">
                                  {item.quantity}
                                </span>

                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      item.quantity +
                                        1
                                    )
                                  }
                                  disabled={
                                    item.quantity >=
                                    item.stockQuantity
                                  }
                                  className="h-8 w-8 rounded-lg bg-gray-100 font-bold transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                                  aria-label={`Increase ${item.name} quantity`}
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() =>
                                  removeFromCart(
                                    item.id
                                  )
                                }
                                className="text-sm font-semibold text-red-500 transition hover:text-red-700"
                              >
                                Remove
                              </button>

                            </div>
                          </div>
                        </div>

                        {/* Item Subtotal */}
                        <div className="mt-4 border-t pt-3 text-right">
                          <span className="text-sm text-gray-500">
                            Subtotal:{" "}
                          </span>

                          <span className="font-bold text-[#14532D]">
                            ₦
                            {(
                              item.price *
                              item.quantity
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t bg-[#FAFAF7] px-6 py-6">

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Products Total
                  </span>

                  <span className="text-2xl font-bold text-[#14532D]">
                    ₦
                    {orderTotal.toLocaleString()}
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Delivery fee will be confirmed by Yetop.
                </p>

                <Link
                  href="/checkout"
                  onClick={() =>
                    setShowCart(false)
                  }
                  className="mt-5 block w-full rounded-full bg-[#14532D] px-6 py-4 text-center font-bold text-white transition hover:bg-[#0f3d21]"
                >
                  Continue to Checkout
                </Link>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Shared Footer */}
      <Footer />

    </main>
  );
}