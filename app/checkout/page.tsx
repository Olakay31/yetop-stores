"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";

type DeliveryPreference =
  | "PICKUP"
  | "YETOP_DELIVERY";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    totalItems,
    orderTotal,
    clearCart,
  } = useCart();;

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [deliveryPreference, setDeliveryPreference] =
    useState<DeliveryPreference>("YETOP_DELIVERY");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [deliveryNote, setDeliveryNote] =
    useState("");

  const [showValidation, setShowValidation] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState<string | null>(null);

  const handleDeliveryPreferenceChange = (
    preference: DeliveryPreference
  ) => {
    setDeliveryPreference(preference);

    setShowValidation(false);
    setSubmitError(null);

    /*
     * Clear delivery-only fields when Pickup
     * is selected.
     */
    if (preference === "PICKUP") {
      setAddress("");
      setCity("");
      setState("");
      setDeliveryNote("");
    }
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setShowValidation(false);
    setSubmitError(null);

    const needsDeliveryAddress =
      deliveryPreference ===
      "YETOP_DELIVERY";

    if (
      cart.length === 0 ||
      !fullName.trim() ||
      !phone.trim() ||
      (needsDeliveryAddress &&
        (
          !address.trim() ||
          !city.trim() ||
          !state.trim()
        ))
    ) {
      setShowValidation(true);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(
        "/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            customer: {
              fullName:
                fullName.trim(),

              phone:
                phone.trim(),

              email:
                email.trim(),

              deliveryPreference,

              address:
                needsDeliveryAddress
                  ? address.trim()
                  : "",

              city:
                needsDeliveryAddress
                  ? city.trim()
                  : "",

              state:
                needsDeliveryAddress
                  ? state.trim()
                  : "",

              deliveryNote:
                needsDeliveryAddress
                  ? deliveryNote.trim()
                  : "",
            },

            items: cart.map((item) => ({
              id: item.id,
              quantity:
                item.quantity,
              price:
                item.price,
            })),
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to submit your order."
        );
      }

      /*
       * The API is the source of truth for:
       * - order number
       * - submitted prices
       * - order status
       */
      const submittedOrder =
        data.order;

      /*
       * Save a local snapshot for the
       * payment/order flow.
       */
      const orderSnapshot = {
        orderNumber:
          submittedOrder.orderNumber,

        status:
          submittedOrder.status,

        customer: {
          fullName:
            fullName.trim(),

          phone:
            phone.trim(),

          email:
            email.trim(),

          deliveryPreference,

          address:
            needsDeliveryAddress
              ? address.trim()
              : "",

          city:
            needsDeliveryAddress
              ? city.trim()
              : "",

          state:
            needsDeliveryAddress
              ? state.trim()
              : "",

          deliveryNote:
            needsDeliveryAddress
              ? deliveryNote.trim()
              : "",
        },

        items:
          submittedOrder.items.map(
            (item: {
              productId: string;
              productUnitId: string;
              name: string;
              unit: string;
              quantity: number;
              price: number;
              lineTotal: number;
            }) => ({
              id:
                `${item.productId}-${item.productUnitId}`,

              name:
                item.name,

              category:
                cart.find(
                  (cartItem) =>
                    cartItem.id ===
                    `${item.productId}-${item.productUnitId}`
                )?.category ??
                "Product",

              price:
                item.price,

              unit:
                item.unit,

              image:
                cart.find(
                  (cartItem) =>
                    cartItem.id ===
                    `${item.productId}-${item.productUnitId}`
                )?.image ??
                "🌿",

              quantity:
                item.quantity,
            })
          ),

        totalItems:
          submittedOrder.items.reduce(
            (
              total: number,
              item: {
                quantity: number;
              }
            ) =>
              total +
              item.quantity,
            0
          ),

        /*
         * IMPORTANT:
         * This is the product amount only.
         * Delivery is NOT included.
         */
        orderTotal:
          submittedOrder.productsTotal,

        deliveryFee:
          "To be confirmed",
      };

      sessionStorage.setItem(
        "yetop-last-order",
        JSON.stringify(
          orderSnapshot
        )
      );
      
      // Clear the active shopping cart only after
      // the order has been successfully created.
      clearCart();
      
      router.push(
        "/order-confirmation"
      );

      /*
       * Go directly to product payment.
       *
       * Delivery payment will be handled
       * separately later through Track Order.
       */
      router.push(
        `/pay-order?order=${encodeURIComponent(
          submittedOrder.orderNumber
        )}&phone=${encodeURIComponent(
          phone.trim()
        )}`
      );
    } catch (error) {
      console.error(
        "Order submission failed:",
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not submit your order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF7]">

      {/* Header */}
      <Header
        cartCount={totalItems}
      />

      {/* Page Introduction */}
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-12">
        <div className="max-w-2xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
            Checkout
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-[#1F2937] md:text-5xl">
            Complete your order.
          </h1>

          <p className="mt-5 text-lg leading-8 text-gray-600">
            Provide your details below to place your wholesale order.
          </p>

        </div>
      </section>

      {cart.length === 0 ? (

        /* Empty Cart */
        <section className="mx-auto max-w-2xl px-6 pb-24">

          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">

            <div className="text-6xl">
              🛒
            </div>

            <h2 className="mt-5 text-2xl font-bold text-[#1F2937]">
              Your order is empty
            </h2>

            <p className="mt-3 text-gray-500">
              Add products to your order before continuing to checkout.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-flex rounded-full bg-[#14532D] px-6 py-3 font-semibold text-white transition hover:bg-[#0f3d21]"
            >
              Browse Products
            </Link>

          </div>

        </section>

      ) : (

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-7xl px-6 pb-24"
        >

          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

            {/* Customer Information */}
            <div className="space-y-8">

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

                <div className="mb-7">

                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                    Customer Details
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#1F2937]">
                    Tell us about yourself
                  </h2>

                  <p className="mt-2 text-gray-500">
                    We'll use these details to keep your order history and contact you about your order.
                  </p>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  {/* Full Name */}
                  <div className="md:col-span-2">

                    <label className="mb-2 block text-sm font-semibold text-gray-700">

                      Full Name{" "}

                      <span className="text-red-500">
                        *
                      </span>

                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(
                          event.target.value
                        )
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                    />

                  </div>

                  {/* Phone */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-700">

                      Phone Number{" "}

                      <span className="text-red-500">
                        *
                      </span>

                    </label>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      placeholder="08012345678"
                      autoComplete="tel"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Your phone number helps you track your orders and will be used for your customer history.
                    </p>

                  </div>

                  {/* Email */}
                  <div>

                    <label className="mb-2 block text-sm font-semibold text-gray-700">

                      Email Address{" "}

                      <span className="font-normal text-gray-400">
                        (Optional)
                      </span>

                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                    />

                  </div>

                </div>

              </section>


              {/* Fulfilment */}
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">

                <div className="mb-7">

                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                    Fulfilment
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#1F2937]">
                    How would you like to receive your order?
                  </h2>

                  <p className="mt-2 text-gray-500">
                    Choose pickup or delivery. Delivery charges are not included in your product payment.
                  </p>

                </div>


                <div className="space-y-4">

                  {/* Pickup */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDeliveryPreferenceChange(
                        "PICKUP"
                      )
                    }
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      deliveryPreference ===
                      "PICKUP"
                        ? "border-[#14532D] bg-green-50 ring-2 ring-[#14532D]/10"
                        : "border-gray-200 bg-white hover:border-[#14532D]"
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      <div
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          deliveryPreference ===
                          "PICKUP"
                            ? "border-[#14532D]"
                            : "border-gray-300"
                        }`}
                      >

                        {deliveryPreference ===
                          "PICKUP" && (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#14532D]" />
                        )}

                      </div>

                      <div>

                        <h3 className="font-bold text-[#1F2937]">
                          Pickup
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-gray-500">
                          You can send anyone to collect your order from Yetop.
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#14532D]">
                          No delivery fee
                        </p>

                      </div>

                    </div>

                  </button>


                  {/* Yetop Delivery */}
                  <button
                    type="button"
                    onClick={() =>
                      handleDeliveryPreferenceChange(
                        "YETOP_DELIVERY"
                      )
                    }
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      deliveryPreference ===
                      "YETOP_DELIVERY"
                        ? "border-[#14532D] bg-green-50 ring-2 ring-[#14532D]/10"
                        : "border-gray-200 bg-white hover:border-[#14532D]"
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      <div
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          deliveryPreference ===
                          "YETOP_DELIVERY"
                            ? "border-[#14532D]"
                            : "border-gray-300"
                        }`}
                      >

                        {deliveryPreference ===
                          "YETOP_DELIVERY" && (
                          <div className="h-2.5 w-2.5 rounded-full bg-[#14532D]" />
                        )}

                      </div>

                      <div>

                        <h3 className="font-bold text-[#1F2937]">
                          Yetop Delivery
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-gray-500">
                          Yetop will deliver your order to the address you provide.
                        </p>

                        <p className="mt-2 text-sm font-semibold text-[#D4A72C]">
                          Delivery fee will be communicated separately
                        </p>

                      </div>

                    </div>

                  </button>

                </div>


                {/* Delivery Fields */}
                {deliveryPreference ===
                  "YETOP_DELIVERY" && (

                  <div className="mt-6 space-y-5 border-t border-gray-100 pt-6">

                    <div>

                      <label className="mb-2 block text-sm font-semibold text-gray-700">

                        Delivery Address{" "}

                        <span className="text-red-500">
                          *
                        </span>

                      </label>

                      <textarea
                        value={address}
                        onChange={(event) =>
                          setAddress(
                            event.target.value
                          )
                        }
                        placeholder="Enter the address where you want your order delivered"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                      />

                    </div>


                    <div className="grid gap-5 md:grid-cols-2">

                      {/* City */}
                      <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">

                          City{" "}

                          <span className="text-red-500">
                            *
                          </span>

                        </label>

                        <input
                          type="text"
                          value={city}
                          onChange={(event) =>
                            setCity(
                              event.target.value
                            )
                          }
                          placeholder="e.g. Ikeja"
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                        />

                      </div>


                      {/* State */}
                      <div>

                        <label className="mb-2 block text-sm font-semibold text-gray-700">

                          State{" "}

                          <span className="text-red-500">
                            *
                          </span>

                        </label>

                        <input
                          type="text"
                          value={state}
                          onChange={(event) =>
                            setState(
                              event.target.value
                            )
                          }
                          placeholder="e.g. Lagos"
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                        />

                      </div>

                    </div>


                    {/* Delivery Note */}
                    <div>

                      <label className="mb-2 block text-sm font-semibold text-gray-700">

                        Delivery Note{" "}

                        <span className="font-normal text-gray-400">
                          (Optional)
                        </span>

                      </label>

                      <textarea
                        value={deliveryNote}
                        onChange={(event) =>
                          setDeliveryNote(
                            event.target.value
                          )
                        }
                        placeholder="Any useful information for delivery?"
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-4 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                      />

                    </div>


                    {/* Delivery Notice */}
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-5">

                      <div className="flex gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                          🚚
                        </div>

                        <div>

                          <h3 className="font-bold text-[#14532D]">
                            Delivery fee is separate
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-green-800">
                            Your current payment covers the products only. Yetop will communicate your delivery fee separately. You can pay the delivery fee later from your Track Order page.
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>
                )}

              </section>

            </div>


            {/* Order Summary */}
            <aside className="lg:sticky lg:top-24 lg:self-start">

              <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

                {/* Summary Header */}
                <div className="border-b px-6 py-6">

                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                    Order Summary
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#1F2937]">
                    Your Order
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {totalItems} item
                    {totalItems !== 1
                      ? "s"
                      : ""}
                  </p>

                </div>


                {/* Items */}
                <div className="max-h-[420px] overflow-y-auto px-6 py-6">

                  <div className="space-y-5">

                    {cart.map((item) => (

                      <div
                        key={item.id}
                        className="flex gap-4"
                      >

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                          {item.image}
                        </div>

                        <div className="min-w-0 flex-1">

                          <h3 className="font-bold text-gray-800">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            {item.quantity} × ₦
                            {item.price.toLocaleString()}
                          </p>

                        </div>

                        <div className="font-semibold text-[#14532D]">
                          ₦
                          {(
                            item.price *
                            item.quantity
                          ).toLocaleString()}
                        </div>

                      </div>

                    ))}

                  </div>

                </div>


                {/* Totals */}
                <div className="border-t bg-[#FAFAF7] px-6 py-6">

                  <div className="flex items-center justify-between">

                    <span className="text-gray-600">
                      Products Total
                    </span>

                    <span className="font-semibold text-gray-800">
                      ₦
                      {orderTotal.toLocaleString()}
                    </span>

                  </div>


                  <div className="mt-3 flex items-center justify-between">

                    <span className="text-gray-600">
                      Delivery
                    </span>

                    <span className="text-sm font-semibold text-[#D4A72C]">
                      {deliveryPreference ===
                      "PICKUP"
                        ? "Pickup — No fee"
                        : "To be communicated"}
                    </span>

                  </div>


                  <div className="mt-5 border-t pt-5">

                    <div className="flex items-center justify-between">

                      <span className="text-lg font-bold text-gray-800">
                        Pay Now
                      </span>

                      <span className="text-2xl font-bold text-[#14532D]">
                        ₦
                        {orderTotal.toLocaleString()}
                      </span>

                    </div>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      This payment covers products only. Delivery fee, if applicable, will be communicated separately.
                    </p>

                  </div>


                  {showValidation && (

                    <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
                      Please complete all required fields before submitting your order.
                    </div>

                  )}


                  {submitError && (

                    <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
                      {submitError}
                    </div>

                  )}


                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-6 w-full rounded-full bg-[#14532D] px-6 py-4 font-bold text-white transition hover:bg-[#0f3d21] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting
                      ? "Submitting Order..."
                      : "Place Order →"}
                  </button>


                  <p className="mt-4 text-center text-xs leading-5 text-gray-500">
                    After placing your order, you will proceed directly to product payment.
                  </p>

                </div>

              </section>


              {/* Back to Shopping */}
              <Link
                href="/products"
                className="mt-5 block text-center text-sm font-semibold text-[#14532D] transition hover:text-[#0f3d21]"
              >
                ← Continue Shopping
              </Link>

            </aside>

          </div>

        </form>

      )}

      {/* Footer */}
      <Footer />

    </main>
  );
}