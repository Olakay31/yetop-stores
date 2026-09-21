"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";

type OrderSnapshot = {
  orderNumber: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
  };
  items: {
    id: number;
    name: string;
    category: string;
    price: number;
    unit: string;
    image: string;
    quantity: number;
  }[];
  totalItems: number;
  orderTotal: number;
  deliveryFee: string;
};

export default function OrderConfirmationPage() {
  const { clearCart } = useCart();

  const [order, setOrder] = useState<OrderSnapshot | null>(null);

  useEffect(() => {
    const savedOrder = sessionStorage.getItem("yetop-last-order");

    if (!savedOrder) {
      return;
    }

    try {
      const parsedOrder: OrderSnapshot =
        JSON.parse(savedOrder);

      setOrder(parsedOrder);

      // Clear the active cart once the submitted
      // order has been loaded successfully.
      clearCart();
    } catch (error) {
      console.error(
        "Unable to load submitted order:",
        error
      );
    }

    // We intentionally run this only once when
    // the confirmation page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!order) {
    return (
      <main className="min-h-screen bg-[#FAFAF7]">

        <Header cartCount={0} />

        <section className="mx-auto max-w-2xl px-6 py-24">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="text-6xl">
              📦
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#1F2937]">
              Order information unavailable
            </h1>

            <p className="mt-3 text-gray-500">
              We couldn't find the submitted order details.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-block rounded-full bg-[#14532D] px-7 py-4 font-semibold text-white transition hover:bg-[#0f3d21]"
            >
              Continue Shopping
            </Link>

          </div>
        </section>

        <Footer />

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7]">

      {/* Header */}
      <Header cartCount={0} />

      {/* Confirmation */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">

        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm md:p-12">

          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-[#14532D]">
            ✓
          </div>

          {/* Heading */}
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
            Order Received
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#1F2937] md:text-5xl">
            Thank you for your order!
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-gray-600">
            Your order has been successfully submitted to Yetop.
            Our team will review your order and confirm availability,
            pricing and delivery before payment.
          </p>

          {/* Order Number */}
          <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-[#FAFAF7] p-6">

            <p className="text-sm font-medium text-gray-500">
              Your Order Number
            </p>

            <p className="mt-2 text-3xl font-bold tracking-wider text-[#14532D]">
              {order.orderNumber}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Please keep this number for your records.
            </p>

          </div>

          {/* Order Summary */}
          <div className="mx-auto mt-8 max-w-sm border-t border-gray-100 pt-6">

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Products
              </span>

              <span className="font-semibold text-gray-800">
                {order.totalItems} item
                {order.totalItems !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-gray-500">
                Products Total
              </span>

              <span className="font-bold text-[#14532D]">
                ₦{order.orderTotal.toLocaleString()}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Delivery
              </span>

              <span className="font-semibold text-[#D4A72C]">
                {order.deliveryFee}
              </span>
            </div>

          </div>

          {/* Ordered Products */}
          <div className="mx-auto mt-8 max-w-xl border-t border-gray-100 pt-6 text-left">

            <h2 className="text-lg font-bold text-[#1F2937]">
              Items in your order
            </h2>

            <div className="mt-4 space-y-3">

              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-[#FAFAF7] p-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
                      {item.image}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.quantity} × ₦
                        {item.price.toLocaleString()} / {item.unit}
                      </p>
                    </div>

                  </div>

                  <p className="font-bold text-[#14532D]">
                    ₦
                    {(
                      item.price * item.quantity
                    ).toLocaleString()}
                  </p>

                </div>
              ))}

            </div>

          </div>

          {/* What Happens Next */}
          <div className="mt-8 rounded-2xl bg-green-50 p-5 text-left">

            <h3 className="font-bold text-[#14532D]">
              What happens next?
            </h3>

            <p className="mt-2 text-sm leading-6 text-green-800">
              Yetop will review your order and contact you using
              the phone number provided during checkout. We will
              confirm your final price, delivery fee and payment
              instructions.
            </p>

          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

            <Link
              href="/products"
              className="rounded-full bg-[#14532D] px-7 py-4 font-semibold text-white transition hover:bg-[#0f3d21]"
            >
              Continue Shopping
            </Link>

            <Link
              href="/"
              className="rounded-full border border-gray-200 bg-white px-7 py-4 font-semibold text-gray-700 transition hover:border-[#14532D] hover:text-[#14532D]"
            >
              Back to Home
            </Link>

          </div>

        </div>

      </section>

      {/* Footer */}
      <Footer />

    </main>
  );
}