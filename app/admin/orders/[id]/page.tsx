"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  productId: string;
  productUnitId: string;
  productName: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  inventory: {
    stockQuantity: number;
    reservedQty: number;
    availableQuantity: number;
    orderReservedQuantity: number;
  } | null;
};

type Payment = {
  id: string;
  status: string;
  paymentType?: string;
  amount: number;
  paymentReference: string | null;
  evidenceUrl: string | null;
  adminNote: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
};

type InventoryHistory = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  reference: string | null;
  createdAt: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  productsTotal: number;
  deliveryFee: number | null;
  grandTotal: number | null;
  deliveryPaymentMethod: string;
  deliveryPaymentStatus: string;

  customer: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  };

  delivery: {
    preference: string;
    address: string;
    city: string;
    state: string;
    note: string | null;
  };

  cancellationReason: string | null;
  adminNote: string | null;

  createdAt: string;
  updatedAt: string;

  approvedAt: string | null;
  cancelledAt: string | null;
  fulfilledAt: string | null;
  pickupAt: string | null;
  deliveredAt: string | null;

  items: OrderItem[];
  payments: Payment[];
  inventoryHistory: InventoryHistory[];
  totalItems: number;
};

type ApiResponse = {
  success: boolean;
  error?: string;
  order?: Order;
};

type PaymentActionResponse = {
  success: boolean;
  error?: string;
  message?: string;
  payment?: Payment;
  order?: Order;
};

type OrderActionResponse = {
  success: boolean;
  error?: string;
  message?: string;
  order?: Order;
};

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(
  value: number | null
) {
  if (value === null) {
    return "To be confirmed";
  }

  return `₦${value.toLocaleString(
    "en-NG"
  )}`;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function getStatusClasses(
  status: string
) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

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

function getPaymentStatusClasses(
  status: string
) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "VERIFIED":
      return "bg-green-50 text-green-700 border-green-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function formatStatus(
  status: string
) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

export default function AdminOrderDetailPage({
  params,
}: RouteProps) {
  const { id } = use(params);

  const [order, setOrder] =
    useState<Order | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [
    paymentActionLoading,
    setPaymentActionLoading,
  ] = useState(false);

  const [
    deliveryFeeInput,
    setDeliveryFeeInput,
  ] = useState("");

  const [
    deliveryFeeLoading,
    setDeliveryFeeLoading,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [paymentError, setPaymentError] =
    useState("");

  const [
    deliveryFeeError,
    setDeliveryFeeError,
  ] = useState("");

  const [
    deliveryFeeSuccess,
    setDeliveryFeeSuccess,
  ] = useState("");

  async function loadOrder() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/orders/${id}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.order
      ) {
        throw new Error(
          data.error ||
            "Unable to load order."
        );
      }

      setOrder(data.order);

      if (
        data.order.deliveryFee !==
          null &&
        data.order.deliveryFee !==
          undefined
      ) {
        setDeliveryFeeInput(
          String(
            data.order.deliveryFee
          )
        );
      } else {
        setDeliveryFeeInput("");
      }
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load order."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  /*
   * ============================================================
   * UPDATE DELIVERY FEE
   * ============================================================
   */
  async function handleUpdateDeliveryFee() {
    if (!order) {
      return;
    }

    if (
      order.delivery.preference !==
      "YETOP_DELIVERY"
    ) {
      return;
    }

    const fee =
      Number(
        deliveryFeeInput
      );

    if (
      deliveryFeeInput.trim() ===
        "" ||
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      setDeliveryFeeError(
        "Please enter a valid delivery fee."
      );

      setDeliveryFeeSuccess("");

      return;
    }

    const confirmed =
      window.confirm(
        `Set the delivery fee for ${order.orderNumber} to ${formatCurrency(
          fee
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeliveryFeeLoading(
        true
      );

      setDeliveryFeeError("");
      setDeliveryFeeSuccess("");
      setError("");

      const response =
        await fetch(
          `/api/admin/orders/${order.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action:
                "UPDATE_DELIVERY_FEE",

              deliveryFee:
                fee,
            }),
          }
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to update delivery fee."
        );
      }

      await loadOrder();

      setDeliveryFeeSuccess(
        "Delivery fee updated successfully."
      );
    } catch (error) {
      console.error(error);

      setDeliveryFeeError(
        error instanceof Error
          ? error.message
          : "Unable to update delivery fee."
      );
    } finally {
      setDeliveryFeeLoading(
        false
      );
    }
  }

  /*
   * ============================================================
   * MARK PICKUP
   * ============================================================
   */
  async function handleMarkPickup() {
    if (!order) {
      return;
    }

    const confirmed =
      window.confirm(
        `Mark order ${order.orderNumber} as Pickup?\n\nConfirm that the customer or their representative has picked up the order.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/orders/${order.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action:
                "MARK_PICKUP",
            }),
          }
        );

      const data =
        (await response.json()) as OrderActionResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to mark order as Pickup."
        );
      }

      await loadOrder();

      window.alert(
        "Order marked as Pickup successfully."
      );
    } catch (error) {
      console.error(
        "Mark pickup failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to mark order as Pickup."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * ============================================================
   * MARK DELIVERED
   * ============================================================
   */
  async function handleMarkDelivered() {
    if (!order) {
      return;
    }

    const confirmed =
      window.confirm(
        `Mark order ${order.orderNumber} as Delivered?\n\nConfirm that the order has been delivered to the customer.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/orders/${order.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action:
                "MARK_DELIVERED",
            }),
          }
        );

      const data =
        (await response.json()) as OrderActionResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to mark order as Delivered."
        );
      }

      await loadOrder();

      window.alert(
        "Order marked as Delivered successfully."
      );
    } catch (error) {
      console.error(
        "Mark delivered failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to mark order as Delivered."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * ============================================================
   * CANCEL
   * ============================================================
   */
  async function handleCancel() {
    if (!order) {
      return;
    }

    const reason =
      window.prompt(
        "Please enter the reason for cancelling this order:"
      );

    if (reason === null) {
      return;
    }

    const trimmedReason =
      reason.trim();

    if (!trimmedReason) {
      setError(
        "A cancellation reason is required."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Cancel order ${order.orderNumber}?\n\nThe reserved inventory will be released.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const response =
        await fetch(
          `/api/admin/orders/${order.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "CANCEL",
              cancellationReason:
                trimmedReason,
            }),
          }
        );

      const data =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to cancel order."
        );
      }

      await loadOrder();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to cancel order."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * ============================================================
   * VERIFY PAYMENT
   * ============================================================
   */
  async function handleVerifyPayment(
    payment: Payment
  ) {
    if (!order) {
      return;
    }

    const confirmed =
      window.confirm(
        `Verify payment of ${formatCurrency(
          payment.amount
        )} for order ${order.orderNumber}?\n\nInventory will be deducted and the order will move to Fulfilment.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setPaymentActionLoading(
        true
      );

      setPaymentError("");
      setError("");

      const response =
        await fetch(
          `/api/admin/payments/${encodeURIComponent(
            payment.id
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "VERIFY",
            }),
          }
        );

      const data =
        (await response.json()) as PaymentActionResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to verify payment."
        );
      }

      await loadOrder();

      window.alert(
        "Payment verified successfully. Inventory has been deducted and the order has moved to Fulfilment."
      );
    } catch (error) {
      console.error(
        "Payment verification failed:",
        error
      );

      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to verify payment."
      );
    } finally {
      setPaymentActionLoading(
        false
      );
    }
  }

  /*
   * ============================================================
   * REJECT PAYMENT
   * ============================================================
   */
  async function handleRejectPayment(
    payment: Payment
  ) {
    if (!order) {
      return;
    }

    const reason =
      window.prompt(
        "Please enter the reason for rejecting this payment:"
      );

    if (reason === null) {
      return;
    }

    const trimmedReason =
      reason.trim();

    if (!trimmedReason) {
      setPaymentError(
        "A rejection reason is required."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Reject payment of ${formatCurrency(
          payment.amount
        )} for order ${order.orderNumber}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setPaymentActionLoading(
        true
      );

      setPaymentError("");
      setError("");

      const response =
        await fetch(
          `/api/admin/payments/${encodeURIComponent(
            payment.id
          )}`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "REJECT",
              adminNote:
                trimmedReason,
            }),
          }
        );

      const data =
        (await response.json()) as PaymentActionResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to reject payment."
        );
      }

      await loadOrder();

      window.alert(
        "Payment rejected successfully."
      );
    } catch (error) {
      console.error(
        "Payment rejection failed:",
        error
      );

      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to reject payment."
      );
    } finally {
      setPaymentActionLoading(
        false
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF7]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">
              🌿
            </div>

            <p className="mt-4 text-gray-500">
              Loading order details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="min-h-screen bg-[#FAFAF7]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-[#14532D]"
          >
            ← Back to Orders
          </Link>

          <div className="mt-6 rounded-2xl border border-red-100 bg-white p-10 shadow-sm">
            <h1 className="text-2xl font-bold text-red-700">
              Unable to load order
            </h1>

            <p className="mt-3 text-gray-500">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  const canCancel =
    order.status ===
      "AWAITING_PAYMENT" ||
    order.status ===
      "PENDING_APPROVAL";

  const pendingPayments =
    order.payments.filter(
      (payment) =>
        payment.status ===
        "PENDING"
    );

  const isPickup =
    order.delivery.preference ===
    "PICKUP";

  const isYetopDelivery =
    order.delivery.preference ===
    "YETOP_DELIVERY";

  /*
   * ============================================================
   * FINAL ACTION CONDITIONS
   * ============================================================
   */

  const canMarkPickup =
    order.status ===
      "FULFILMENT" &&
    isPickup;

  const canMarkDelivered =
    order.status ===
      "FULFILMENT" &&
    isYetopDelivery &&
    (
      order.deliveryFee ===
        null ||
      Number(
        order.deliveryFee
      ) === 0 ||
      order.deliveryPaymentStatus ===
        "PAID"
    );

  const deliveryPaymentPending =
    isYetopDelivery &&
    order.status ===
      "FULFILMENT" &&
    order.deliveryFee !==
      null &&
    Number(
      order.deliveryFee
    ) > 0 &&
    order.deliveryPaymentStatus !==
      "PAID";

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-2xl">
              🌿
            </div>

            <div>
              <p className="font-bold text-[#14532D]">
                YETOP STORES
              </p>

              <p className="text-xs text-gray-500">
                Admin Portal
              </p>
            </div>
          </div>

          <Link
            href="/admin/orders"
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#14532D] transition hover:border-[#14532D]"
          >
            ← Orders
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Page heading */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-[#14532D]"
            >
              ← Back to Orders
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
              Order Details
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-bold text-[#1F2937]">
                {order.orderNumber}
              </h1>

              <span
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${getStatusClasses(
                  order.status
                )}`}
              >
                {formatStatus(
                  order.status
                )}
              </span>
            </div>

            <p className="mt-3 text-gray-500">
              Created{" "}
              {formatDate(
                order.createdAt
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {canMarkPickup && (
              <button
                type="button"
                onClick={
                  handleMarkPickup
                }
                disabled={
                  actionLoading
                }
                className="rounded-full bg-[#14532D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f4224] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Processing..."
                  : "Mark as Pickup"}
              </button>
            )}

            {canMarkDelivered && (
              <button
                type="button"
                onClick={
                  handleMarkDelivered
                }
                disabled={
                  actionLoading
                }
                className="rounded-full bg-[#14532D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f4224] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Processing..."
                  : "Mark as Delivered"}
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={
                  actionLoading
                }
                className="rounded-full border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Processing..."
                  : "Cancel Order"}
              </button>
            )}
          </div>
        </div>

        {/* Delivery payment pending notice */}
        {deliveryPaymentPending && (
          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-yellow-800">
                  Delivery payment pending
                </p>

                <p className="mt-1 text-sm text-yellow-700">
                  The order cannot be marked as Delivered until the delivery fee has been paid and verified.
                </p>
              </div>

              <span className="font-bold text-yellow-800">
                {formatCurrency(
                  order.deliveryFee
                )}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Payment action error */}
        {paymentError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {paymentError}
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Products Total
            </p>

            <p className="mt-2 text-2xl font-bold text-[#14532D]">
              {formatCurrency(
                order.productsTotal
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Delivery Fee
            </p>

            <p className="mt-2 text-2xl font-bold text-[#1F2937]">
              {isPickup
                ? "Not applicable"
                : formatCurrency(
                    order.deliveryFee
                  )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Grand Total
            </p>

            <p className="mt-2 text-2xl font-bold text-[#1F2937]">
              {isPickup
                ? formatCurrency(
                    order.productsTotal
                  )
                : formatCurrency(
                    order.grandTotal
                  )}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Fulfilment
            </p>

            <p className="mt-2 text-lg font-bold text-[#1F2937]">
              {isPickup
                ? "Pickup"
                : "Yetop Delivery"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Customer */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-[#1F2937]">
              Customer
            </h2>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Name
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {
                    order.customer
                      .fullName
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Phone
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {
                    order.customer
                      .phone
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Email
                </p>

                <p className="mt-1 font-semibold text-gray-800">
                  {order.customer
                    .email ||
                    "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">
                  Delivery
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Fulfilment and delivery payment details
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
                  isPickup
                    ? "border-green-200 bg-green-50 text-[#14532D]"
                    : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {isPickup
                  ? "Pickup"
                  : "Yetop Delivery"}
              </span>
            </div>

            {isPickup ? (
              <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#14532D]">
                  Pickup
                </p>

                <p className="mt-2 text-lg font-bold text-[#14532D]">
                  Pickup — Customer will collect the order from Yetop.
                </p>

                <p className="mt-2 text-sm leading-6 text-green-800">
                  No delivery address or delivery fee is required for this order.
                </p>

                {order.pickupAt && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                      Pickup completed
                    </p>

                    <p className="mt-1 font-semibold text-[#14532D]">
                      {formatDate(
                        order.pickupAt
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-5 border-t border-green-200 pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-800">
                      Delivery Fee
                    </span>

                    <span className="font-bold text-[#14532D]">
                      Not applicable
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Address
                  </p>

                  <p className="mt-2 leading-7 text-gray-700">
                    {
                      order.delivery
                        .address
                    }
                    <br />
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

                  {order.delivery
                    .note && (
                    <div className="mt-4 rounded-xl bg-[#FAFAF7] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Delivery Note
                      </p>

                      <p className="mt-1 text-sm leading-6 text-gray-700">
                        {
                          order.delivery
                            .note
                        }
                      </p>
                    </div>
                  )}
                </div>

                {order.deliveredAt && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#14532D]">
                      Delivery completed
                    </p>

                    <p className="mt-1 font-semibold text-[#14532D]">
                      {formatDate(
                        order.deliveredAt
                      )}
                    </p>
                  </div>
                )}

                {/* Delivery fee editor */}
                <div className="mt-7 rounded-2xl border border-gray-200 bg-[#FAFAF7] p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="flex-1">
                      <label
                        htmlFor="deliveryFee"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Delivery Fee
                      </label>

                      <div className="mt-2 flex">
                        <span className="flex items-center rounded-l-xl border border-r-0 border-gray-200 bg-white px-4 font-semibold text-gray-600">
                          ₦
                        </span>

                        <input
                          id="deliveryFee"
                          type="number"
                          min="0"
                          step="1"
                          value={
                            deliveryFeeInput
                          }
                          onChange={(
                            event
                          ) => {
                            setDeliveryFeeInput(
                              event.target
                                .value
                            );

                            setDeliveryFeeError(
                              ""
                            );

                            setDeliveryFeeSuccess(
                              ""
                            );
                          }}
                          placeholder="Enter delivery fee"
                          className="w-full rounded-r-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-800 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                        />
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Enter the delivery amount communicated to the customer.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        handleUpdateDeliveryFee
                      }
                      disabled={
                        deliveryFeeLoading
                      }
                      className="rounded-xl bg-[#14532D] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0f4224] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deliveryFeeLoading
                        ? "Updating..."
                        : "Update Delivery Fee"}
                    </button>
                  </div>

                  {deliveryFeeError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {
                        deliveryFeeError
                      }
                    </div>
                  )}

                  {deliveryFeeSuccess && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-[#14532D]">
                      {
                        deliveryFeeSuccess
                      }
                    </div>
                  )}

                  {order.deliveryFee !==
                    null && (
                    <div className="mt-6 border-t border-gray-200 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Delivery Fee
                        </span>

                        <span className="font-bold text-[#1F2937]">
                          {formatCurrency(
                            order.deliveryFee
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Grand Total
                        </span>

                        <span className="text-xl font-bold text-[#14532D]">
                          {formatCurrency(
                            order.grandTotal
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Delivery Payment
                        </span>

                        <span className="text-sm font-semibold text-[#D4A72C]">
                          {formatStatus(
                            order.deliveryPaymentStatus
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-7">
            <h2 className="text-xl font-bold text-[#1F2937]">
              Items in Order
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {order.totalItems} total item
              {order.totalItems === 1
                ? ""
                : "s"}
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {order.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="p-7"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-2xl">
                        🌿
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800">
                          {
                            item.productName
                          }
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            item.quantity
                          }{" "}
                          ×{" "}
                          {formatCurrency(
                            item.unitPrice
                          )}{" "}
                          /{" "}
                          {
                            item.unitName
                          }
                        </p>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <p className="text-lg font-bold text-[#14532D]">
                        {formatCurrency(
                          item.lineTotal
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Inventory */}
                  {item.inventory && (
                    <div className="mt-6 rounded-xl bg-[#FAFAF7] p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-800">
                          Inventory
                        </h4>

                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {
                            item.unitName
                          }
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-4">
                        <div>
                          <p className="text-xs text-gray-400">
                            Total Stock
                          </p>

                          <p className="mt-1 font-bold text-gray-800">
                            {
                              item
                                .inventory
                                .stockQuantity
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Reserved
                          </p>

                          <p className="mt-1 font-bold text-orange-600">
                            {
                              item
                                .inventory
                                .reservedQty
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            Available
                          </p>

                          <p className="mt-1 font-bold text-[#14532D]">
                            {
                              item
                                .inventory
                                .availableQuantity
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400">
                            This Order
                          </p>

                          <p className="mt-1 font-bold text-gray-800">
                            {
                              item
                                .inventory
                                .orderReservedQuantity
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Cancellation */}
        {order.cancellationReason && (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-7">
            <h2 className="font-bold text-red-800">
              Cancellation Reason
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {
                order.cancellationReason
              }
            </p>
          </div>
        )}

        {/* Inventory history */}
        {order.inventoryHistory
          .length > 0 && (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-[#1F2937]">
              Inventory History
            </h2>

            <div className="mt-5 space-y-3">
              {order.inventoryHistory.map(
                (transaction) => (
                  <div
                    key={
                      transaction.id
                    }
                    className="flex flex-col justify-between gap-2 rounded-xl bg-[#FAFAF7] p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {formatStatus(
                          transaction.type
                        )}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {
                          transaction.reason
                        }
                      </p>
                    </div>

                    <div className="text-sm text-gray-500">
                      Qty:{" "}
                      <span className="font-semibold text-gray-800">
                        {
                          transaction.quantity
                        }
                      </span>
                      {" · "}
                      {formatDate(
                        transaction.createdAt
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Payments */}
        {order.payments.length > 0 && (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1F2937]">
                  Payments
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review submitted payment evidence and verify customer payments.
                </p>
              </div>

              {pendingPayments.length >
                0 && (
                <span className="rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
                  {
                    pendingPayments.length
                  }{" "}
                  Pending Verification
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {order.payments.map(
                (payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-gray-100 bg-[#FAFAF7] p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-bold text-gray-800">
                            {formatCurrency(
                              payment.amount
                            )}
                          </p>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPaymentStatusClasses(
                              payment.status
                            )}`}
                          >
                            {payment.status ===
                            "PENDING"
                              ? "Pending Verification"
                              : formatStatus(
                                  payment.status
                                )}
                          </span>
                        </div>

                        {payment.paymentReference && (
                          <p className="mt-2 text-sm text-gray-500">
                            Ref:{" "}
                            <span className="font-semibold text-gray-800">
                              {
                                payment.paymentReference
                              }
                            </span>
                          </p>
                        )}

                        <p className="mt-1 text-sm text-gray-500">
                          Submitted:{" "}
                          {formatDate(
                            payment.submittedAt
                          )}
                        </p>

                        {payment.adminNote && (
                          <p className="mt-2 text-sm text-gray-500">
                            Admin note:{" "}
                            <span className="font-medium text-gray-700">
                              {
                                payment.adminNote
                              }
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {payment.evidenceUrl && (
                          <a
                            href={
                              payment.evidenceUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                          >
                            View Receipt
                          </a>
                        )}

                        {payment.status ===
                          "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleRejectPayment(
                                  payment
                                )
                              }
                              disabled={
                                paymentActionLoading
                              }
                              className="rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {paymentActionLoading
                                ? "Processing..."
                                : "Reject Payment"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleVerifyPayment(
                                  payment
                                )
                              }
                              disabled={
                                paymentActionLoading
                              }
                              className="rounded-lg bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4224] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {paymentActionLoading
                                ? "Verifying..."
                                : "Verify Payment"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}