"use client";

import { useState } from "react";
import type { Product } from "../context/CartContext";

type ProductCardProps = {
  product: Product;
  onAddToOrder: (product: Product, quantity: number) => void;
};

export default function ProductCard({
  product,
  onAddToOrder,
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(
    product.minOrderQty
  );

  const availableStock = product.stockQuantity;

  const increaseQuantity = () => {
    if (quantity < availableStock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity(
      Math.max(product.minOrderQty, quantity - 1)
    );
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-64 items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 text-8xl">
        {product.image}
      </div>

      <div className="p-6">
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#14532D]">
          {product.category}
        </span>

        <h2 className="mt-4 text-xl font-bold text-[#1F2937]">
          {product.name}
        </h2>

        {product.description && (
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {product.description}
          </p>
        )}

        <div className="mt-4">
          <p className="text-2xl font-bold text-[#14532D]">
            ₦{product.price.toLocaleString()}
          </p>

          <p className="text-sm text-gray-500">
            per {product.unit}
          </p>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Minimum order: {product.minOrderQty}{" "}
          {product.unit}
          {product.minOrderQty !== 1 ? "s" : ""}
        </p>

        <p className="mt-1 text-xs font-medium text-green-700">
          {availableStock} {product.unit}
          {availableStock !== 1 ? "s" : ""} available
        </p>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-200 p-2">
          <button
            onClick={decreaseQuantity}
            disabled={quantity <= product.minOrderQty}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Decrease ${product.name} quantity`}
          >
            −
          </button>

          <span className="font-bold text-gray-800">
            {quantity}
          </span>

          <button
            onClick={increaseQuantity}
            disabled={quantity >= availableStock}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Increase ${product.name} quantity`}
          >
            +
          </button>
        </div>

        <button
          onClick={() =>
            onAddToOrder(product, quantity)
          }
          disabled={availableStock < product.minOrderQty}
          className="mt-4 w-full rounded-full bg-[#14532D] px-5 py-3 font-semibold text-white transition hover:bg-[#0f3d21] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {availableStock < product.minOrderQty
            ? "Out of Stock"
            : "Add to Order"}
        </button>
      </div>
    </article>
  );
}