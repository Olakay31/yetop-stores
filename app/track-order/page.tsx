"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type OrderItem = {
  id: string;
  productName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type TrackedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  productsTotal: number;
  deliveryFee: number | null;
  grandTotal: number | null;
  deliveryPaymentMethod: string;
  deliveryPreference: string;
  deliveryFeePaymentStatus: string;
  deliveryNote: string | null;

  customer: {
    fullName: string;
    phone: string;
    email: string | null;
  };

  delivery: {
    address: string;
    city: string;
    state: string;
  };

  createdAt: string;
  approvedAt: string | null;
  fulfilledAt: string | null;
  deliveredAt: string | null;
  collectedAt: string | null;

  items: OrderItem[];
  totalItems: number;
  nextAction: string;
};

function formatCurrency(amount: number | null) {
  if (amount === null) {
    return "To be confirmed";
  }

  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  const formatted = new Date(date);

  if (Number.isNaN(formatted.getTime())) {
    return null;
  }

  return formatted.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Processing";

    case "AWAITING_PAYMENT":
      return "Awaiting Payment";

    case "FULFILMENT":
      return "Being Prepared";

    case "PICKUP":
      return "Pickup Ready";

    case "DELIVERED":
      return "Delivered";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status.replaceAll("_", " ");
  }
}

function getStatusMessage(
  status: string,
  deliveryPreference: string
) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Your order has been received and is being processed.";

    case "AWAITING_PAYMENT":
      return "Your order is ready for payment. Please complete your product payment to continue.";

    case "FULFILMENT":
      if (deliveryPreference === "PICKUP") {
        return "Your payment has been confirmed and your order is being prepared for pickup.";
      }

      return "Your payment has been confirmed and your order is being prepared for delivery.";

    case "PICKUP":
      return "Your order has been completed through pickup.";

    case "DELIVERED":
      return "Your order has been delivered successfully.";

    case "CANCELLED":
      return "This order has been cancelled.";

    default:
      return "Your order is being processed.";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "AWAITING_PAYMENT":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "FULFILMENT":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "PICKUP":
      return "bg-green-50 text-green-700 border-green-200";

    case "DELIVERED":
      return "bg-green-50 text-green-700 border-green-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function isPickupOrder(order: TrackedOrder) {
  return order.deliveryPreference === "PICKUP";
}

function hasProductPaymentConfirmed(
  order: TrackedOrder
) {
  return (
    order.status === "FULFILMENT" ||
    order.status === "PICKUP" ||
    order.status === "DELIVERED"
  );
}

function hasFulfilmentStarted(
  order: TrackedOrder
) {
  return (
    Boolean(order.fulfilledAt) ||
    order.status === "FULFILMENT" ||
    order.status === "PICKUP" ||
    order.status === "DELIVERED"
  );
}

function hasFinalCompletion(
  order: TrackedOrder
) {
  return (
    order.status === "PICKUP" ||
    order.status === "DELIVERED"
  );
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [order, setOrder] =
    useState<TrackedOrder | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleTrackOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setOrder(null);

    const cleanOrderNumber =
      orderNumber.trim();

    const cleanPhone =
      phone.trim();

    if (!cleanOrderNumber || !cleanPhone) {
      setError(
        "Please enter your order number and phone number."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(
          cleanOrderNumber
        )}&phone=${encodeURIComponent(
          cleanPhone
        )}`
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.error ||
            "We could not find your order."
        );

        return;
      }

      setOrder(data.order);
    } catch (error) {
      console.error(
        "Track order error:",
        error
      );

      setError(
        "Unable to track your order right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleContinueToPayment() {
    if (!order) {
      return;
    }

    window.location.href =
      `/pay-order?order=${encodeURIComponent(
        order.orderNumber
      )}&phone=${encodeURIComponent(
        order.customer.phone
      )}`;
  }

  const isPickup =
    order ? isPickupOrder(order) : false;

  const productPaymentConfirmed =
    order
      ? hasProductPaymentConfirmed(order)
      : false;

  const fulfilmentStarted =
    order
      ? hasFulfilmentStarted(order)
      : false;

  const finalCompletion =
    order
      ? hasFinalCompletion(order)
      : false;

  const deliveryPaymentPending =
    order &&
    !isPickup &&
    order.deliveryFee !== null &&
    order.deliveryFee > 0 &&
    order.deliveryFeePaymentStatus !==
      "PAID";

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ================= BACK NAVIGATION ================= */}

      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#075B3D] transition hover:text-[#064a32]"
          >
            <span className="text-lg">
              ←
            </span>

            Back to Products
          </Link>
        </div>
      </div>

      {/* ================= HEADER ================= */}

      <section className="bg-[#075B3D] px-4 py-14 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
            🌿
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Track Your Order
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-green-100 sm:text-base">
            Enter your order number and phone
            number to check the current status
            of your Yetop order.
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">

          {/* ================= SEARCH FORM ================= */}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
            <form
              onSubmit={handleTrackOrder}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="orderNumber"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Order Number
                </label>

                <input
                  id="orderNumber"
                  type="text"
                  value={orderNumber}
                  onChange={(event) =>
                    setOrderNumber(
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="e.g. YETF2MSR"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 font-semibold uppercase outline-none transition focus:border-[#075B3D] focus:ring-2 focus:ring-[#075B3D]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 08060002626"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#075B3D] focus:ring-2 focus:ring-[#075B3D]/10"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#075B3D] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#064a32] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Checking Order..."
                  : "Track Order"}
              </button>
            </form>
          </div>

          {/* ================= ORDER RESULT ================= */}

          {order && (
            <div className="mt-6 space-y-5">

              {/* ================= CURRENT STATUS ================= */}

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Order Number
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-gray-900">
                      {order.orderNumber}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(
                      order.status
                    )}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <p className="text-sm leading-6 text-gray-700">
                    {getStatusMessage(
                      order.status,
                      order.deliveryPreference
                    )}
                  </p>
                </div>

                {order.status ===
                  "AWAITING_PAYMENT" && (
                  <button
                    type="button"
                    onClick={
                      handleContinueToPayment
                    }
                    className="mt-5 w-full rounded-xl bg-[#075B3D] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#064a32]"
                  >
                    Continue to Payment
                  </button>
                )}

                {/* Pickup instruction */}

                {order.status ===
                  "FULFILMENT" &&
                  isPickup && (
                    <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-[#075B3D]">
                        Pickup
                      </p>

                      <p className="mt-1 text-sm leading-6 text-green-800">
                        Your order is being
                        prepared for pickup.
                        We will confirm when
                        the pickup is completed.
                      </p>
                    </div>
                  )}

                {/* Delivery instruction */}

                {order.status ===
                  "FULFILMENT" &&
                  !isPickup && (
                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-800">
                        Yetop Delivery
                      </p>

                      <p className="mt-1 text-sm leading-6 text-blue-700">
                        Your order is being
                        prepared for delivery.
                      </p>
                    </div>
                  )}

                {/* Delivery payment notice */}

                {deliveryPaymentPending && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-800">
                      Delivery payment pending
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-700">
                      Your delivery fee is{" "}
                      <span className="font-semibold">
                        {formatCurrency(
                          order.deliveryFee
                        )}
                      </span>
                      . Delivery payment
                      will be completed separately.
                    </p>
                  </div>
                )}

                {/* Completed message */}

                {order.status ===
                  "PICKUP" && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-semibold text-[#075B3D]">
                      Pickup completed ✓
                    </p>

                    {order.collectedAt && (
                      <p className="mt-1 text-xs text-green-800">
                        {formatDate(
                          order.collectedAt
                        )}
                      </p>
                    )}
                  </div>
                )}

                {order.status ===
                  "DELIVERED" && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-semibold text-[#075B3D]">
                      Delivery completed ✓
                    </p>

                    {order.deliveredAt && (
                      <p className="mt-1 text-xs text-green-800">
                        {formatDate(
                          order.deliveredAt
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* ================= PAYMENT SUMMARY ================= */}

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
                <h3 className="text-lg font-bold text-gray-900">
                  Payment Summary
                </h3>

                <div className="mt-4 space-y-3">

                  {/* Product payment */}

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Products
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Product payment
                        </p>
                      </div>

                      <p className="font-bold text-gray-900">
                        {formatCurrency(
                          order.productsTotal
                        )}
                      </p>
                    </div>

                    <div
                      className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
                        productPaymentConfirmed
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {productPaymentConfirmed
                        ? "Product payment confirmed ✓"
                        : "Product payment pending"}
                    </div>
                  </div>

                  {/* Delivery payment */}

                  {isPickup ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Pickup
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            No delivery fee
                          </p>
                        </div>

                        <p className="font-bold text-gray-900">
                          Not applicable
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            Delivery
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Yetop Delivery
                          </p>
                        </div>

                        <p className="font-bold text-gray-900">
                          {formatCurrency(
                            order.deliveryFee
                          )}
                        </p>
                      </div>

                      {order.deliveryFee !==
                        null &&
                        order.deliveryFee > 0 && (
                          <div
                            className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
                              order.deliveryFeePaymentStatus ===
                              "PAID"
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {order.deliveryFeePaymentStatus ===
                            "PAID"
                              ? "Delivery payment confirmed ✓"
                              : "Delivery payment pending"}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* ================= YOUR ORDER ================= */}

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Your Order
                  </h3>

                  <span className="text-xs font-medium text-gray-500">
                    {order.totalItems} item
                    {order.totalItems !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                <div className="mt-4 divide-y divide-gray-100">
                  {order.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {item.productName}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {item.quantity} ×{" "}
                            {item.unitName}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {formatCurrency(
                              item.unitPrice
                            )}{" "}
                            per{" "}
                            {item.unitName}
                          </p>
                        </div>

                        <p className="shrink-0 font-semibold text-gray-900">
                          {formatCurrency(
                            item.lineTotal
                          )}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Products Total
                    </span>

                    <span className="font-semibold text-gray-900">
                      {formatCurrency(
                        order.productsTotal
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Delivery Fee
                    </span>

                    <span className="font-semibold text-gray-900">
                      {isPickup
                        ? "Not applicable"
                        : formatCurrency(
                            order.deliveryFee
                          )}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        Product Payment
                      </span>

                      <span className="text-lg font-bold text-[#075B3D]">
                        {formatCurrency(
                          order.productsTotal
                        )}
                      </span>
                    </div>

                    {!isPickup && (
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        Delivery fee is separate
                        and is not included in the
                        product payment.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ================= CUSTOMER + DELIVERY ================= */}

              <div className="grid gap-5 sm:grid-cols-2">

                {/* Customer */}

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <h3 className="font-bold text-gray-900">
                    Customer
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">
                        Name
                      </p>

                      <p className="mt-1 font-medium text-gray-800">
                        {
                          order.customer
                            .fullName
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Phone
                      </p>

                      <p className="mt-1 font-medium text-gray-800">
                        {
                          order.customer
                            .phone
                        }
                      </p>
                    </div>

                    {order.customer.email && (
                      <div>
                        <p className="text-xs text-gray-400">
                          Email
                        </p>

                        <p className="mt-1 break-all font-medium text-gray-800">
                          {
                            order.customer
                              .email
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery */}

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-gray-900">
                      {isPickup
                        ? "Fulfilment"
                        : "Delivery"}
                    </h3>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        isPickup
                          ? "border-green-200 bg-green-50 text-[#075B3D]"
                          : "border-blue-200 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {isPickup
                        ? "Pickup"
                        : "Yetop Delivery"}
                    </span>
                  </div>

                  {isPickup ? (
                    <div className="mt-4">
                      <p className="text-sm leading-6 text-gray-700">
                        Your order will be
                        prepared for pickup
                        from Yetop.
                      </p>

                      <p className="mt-3 text-xs leading-5 text-gray-500">
                        No delivery address or
                        delivery fee is required
                        for this order.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm leading-6 text-gray-700">
                      <p>
                        {
                          order.delivery
                            .address
                        }
                      </p>

                      <p>
                        {
                          order.delivery
                            .city
                        }
                        ,{" "}
                        {
                          order.delivery
                            .state
                        }
                      </p>

                      {order.deliveryNote && (
                        <div className="mt-3 rounded-xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Delivery Note
                          </p>

                          <p className="mt-1 text-sm text-gray-700">
                            {
                              order.deliveryNote
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ================= ORDER TIMELINE ================= */}

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Order Timeline
                  </h3>

                  <p className="text-sm text-gray-500">
                    Follow your order from
                    placement to completion.
                  </p>
                </div>

                <div className="mt-6">

                  {/* Order placed */}

                  <TimelineItem
                    title="Order Placed"
                    description="Your order has been received."
                    date={formatDate(
                      order.createdAt
                    )}
                    active
                    last={false}
                  />

                  {/* Product payment */}

                  <TimelineItem
                    title="Product Payment"
                    description={
                      productPaymentConfirmed
                        ? "Payment confirmed."
                        : order.status ===
                          "AWAITING_PAYMENT"
                        ? "Payment is required to continue."
                        : "Waiting for payment confirmation."
                    }
                    date={
                      productPaymentConfirmed
                        ? formatDate(
                            order.fulfilledAt
                          )
                        : null
                    }
                    active={
                      productPaymentConfirmed
                    }
                    last={false}
                  />

                  {/* Fulfilment */}

                  <TimelineItem
                    title="Fulfilment"
                    description={
                      fulfilmentStarted
                        ? isPickup
                          ? "Your order is being prepared for pickup."
                          : "Your order is being prepared for delivery."
                        : "Your order will be prepared after payment is confirmed."
                    }
                    date={
                      fulfilmentStarted
                        ? formatDate(
                            order.fulfilledAt
                          )
                        : null
                    }
                    active={
                      fulfilmentStarted
                    }
                    last={false}
                  />

                  {/* Final stage */}

                  <TimelineItem
                    title={
                      isPickup
                        ? "Pickup"
                        : "Delivery"
                    }
                    description={
                      finalCompletion
                        ? isPickup
                          ? "Pickup completed successfully."
                          : "Your order has been delivered successfully."
                        : isPickup
                        ? "Your order will be ready for pickup after fulfilment."
                        : "Your order will proceed to delivery after fulfilment."
                    }
                    date={
                      isPickup
                        ? formatDate(
                            order.collectedAt
                          )
                        : formatDate(
                            order.deliveredAt
                          )
                    }
                    active={
                      finalCompletion
                    }
                    last
                  />
                </div>
              </div>

              {/* ================= NEXT ACTION ================= */}

              {!finalCompletion &&
                order.status !==
                  "CANCELLED" &&
                order.status !==
                  "AWAITING_PAYMENT" && (
                  <div className="rounded-2xl border border-[#075B3D]/10 bg-[#075B3D]/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#075B3D]">
                      What happens next
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-700">
                      {isPickup
                        ? "Yetop will prepare your order and confirm when pickup is completed."
                        : "Yetop will prepare your order and complete delivery once all delivery requirements are confirmed."}
                    </p>
                  </div>
                )}

              {/* ================= BOTTOM NAVIGATION ================= */}

              <div className="flex flex-col items-center justify-center gap-3 pb-8 pt-2 sm:flex-row">
                <Link
                  href="/products"
                  className="w-full rounded-xl border border-[#075B3D] px-5 py-3 text-center text-sm font-semibold text-[#075B3D] transition hover:bg-green-50 sm:w-auto"
                >
                  ← Back to Products
                </Link>

                <Link
                  href="/"
                  className="w-full rounded-xl bg-[#075B3D] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#064a32] sm:w-auto"
                >
                  Back to Home
                </Link>
              </div>

              <p className="pb-8 text-center text-xs leading-5 text-gray-500">
                Keep your order number and phone
                number safe. You can return to this
                page anytime to check your order.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function TimelineItem({
  title,
  description,
  date,
  active,
  last,
}: {
  title: string;
  description: string;
  date: string | null;
  active: boolean;
  last: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div
          className={`absolute left-[11px] top-7 h-[calc(100%-4px)] w-px ${
            active
              ? "bg-[#075B3D]/30"
              : "bg-gray-200"
          }`}
        />
      )}

      <div
        className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
          active
            ? "bg-[#075B3D] text-white"
            : "bg-gray-200 text-gray-400"
        }`}
      >
        {active ? "✓" : ""}
      </div>

      <div className="min-w-0 pb-6">
        <p
          className={`text-sm font-semibold ${
            active
              ? "text-gray-900"
              : "text-gray-400"
          }`}
        >
          {title}
        </p>

        <p
          className={`mt-1 text-sm leading-5 ${
            active
              ? "text-gray-600"
              : "text-gray-400"
          }`}
        >
          {description}
        </p>

        {date && (
          <p className="mt-1 text-xs text-gray-500">
            {date}
          </p>
        )}
      </div>
    </div>
  );
}