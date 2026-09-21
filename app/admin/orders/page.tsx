"use client";

import { useEffect, useMemo, useState } from "react";
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
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  productsTotal: number;
  deliveryFee: number | null;
  grandTotal: number | null;
  deliveryPaymentMethod: string;
  customer: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  };
  delivery: {
    address: string;
    city: string;
    state: string;
  };
  cancellationReason: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  cancelledAt: string | null;
  fulfilledAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
  payments: unknown[];
  totalItems: number;
};

type OrdersResponse = {
  success: boolean;
  error?: string;
  summary?: {
    totalOrders: number;
    pendingApproval: number;
    awaitingPayment: number;
    fulfilment: number;
    delivered: number;
    cancelled: number;
    totalCustomers: number;
  };
  orders?: Order[];
};

const STATUS_FILTERS = [
  {
    label: "All",
    value: "ALL",
  },
  {
    label: "Pending Approval",
    value: "PENDING_APPROVAL",
  },
  {
    label: "Awaiting Payment",
    value: "AWAITING_PAYMENT",
  },
  {
    label: "Fulfilment",
    value: "FULFILMENT",
  },
  {
    label: "Delivered",
    value: "DELIVERED",
  },
  {
    label: "Cancelled",
    value: "CANCELLED",
  },
];

function formatCurrency(value: number | null) {
  if (value === null) {
    return "To be confirmed";
  }

  return `₦${value.toLocaleString("en-NG")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClasses(status: string) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    case "AWAITING_PAYMENT":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "FULFILMENT":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "DELIVERED":
      return "border-green-200 bg-green-50 text-green-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] =
    useState<OrdersResponse["summary"]>(undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/orders",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as OrdersResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to load orders."
        );
      }

      setOrders(data.orders || []);
      setSummary(data.summary);
    } catch (error) {
      console.error(
        "Failed to load admin orders:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        order.orderNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        order.customer.fullName
          .toLowerCase()
          .includes(normalizedSearch) ||
        order.customer.phone
          .toLowerCase()
          .includes(normalizedSearch) ||
        (order.customer.email || "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [orders, search, statusFilter]);

  const dashboardSummary = {
    totalOrders:
      summary?.totalOrders ?? 0,

    pendingApproval:
      summary?.pendingApproval ?? 0,

    awaitingPayment:
      summary?.awaitingPayment ?? 0,

    fulfilment:
      summary?.fulfilment ?? 0,

    delivered:
      summary?.delivered ?? 0,

    cancelled:
      summary?.cancelled ?? 0,
  };

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
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
            href="/admin/dashboard"
            className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#14532D] transition hover:border-[#14532D]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Page heading */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
            Order Management
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#1F2937]">
                Orders
              </h1>

              <p className="mt-3 text-gray-500">
                Review, approve and manage retailer
                orders.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#14532D] transition hover:border-[#14532D] disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🛒</span>

              <span className="text-3xl font-bold text-[#14532D]">
                {dashboardSummary.totalOrders}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-600">
              Total Orders
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🕐</span>

              <span className="text-3xl font-bold text-[#14532D]">
                {dashboardSummary.pendingApproval}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-600">
              Pending Approval
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">💳</span>

              <span className="text-3xl font-bold text-[#14532D]">
                {dashboardSummary.awaitingPayment}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-600">
              Awaiting Payment
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📦</span>

              <span className="text-3xl font-bold text-[#14532D]">
                {dashboardSummary.fulfilment}
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-gray-600">
              Fulfilment
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by order number, customer name, phone or email..."
            className="w-full rounded-xl border border-gray-200 bg-[#FAFAF7] px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#14532D]"
          />
        </div>

        {/* Status filters */}
        <div className="mt-5 overflow-x-auto">
          <div className="flex min-w-max gap-2 pb-2">
            {STATUS_FILTERS.map((filter) => {
              const active =
                statusFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(filter.value)
                  }
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#14532D] text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-[#14532D] hover:text-[#14532D]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders */}
        <div className="mt-5">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <div className="text-3xl">🌿</div>

              <p className="mt-4 text-gray-500">
                Loading orders...
              </p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <div className="text-4xl">🛒</div>

              <h2 className="mt-4 text-xl font-bold text-[#1F2937]">
                No orders found
              </h2>

              <p className="mt-2 text-gray-500">
                Try changing your search or status
                filter.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-gray-100 bg-[#FAFAF7]">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Order
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Customer
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Total
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Status
                        </th>

                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Date
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="transition hover:bg-[#FAFAF7]"
                        >
                          <td className="px-6 py-5">
                            <p className="font-bold text-[#1F2937]">
                              {order.orderNumber}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {order.totalItems} item
                              {order.totalItems === 1
                                ? ""
                                : "s"}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <p className="font-semibold text-gray-800">
                              {order.customer.fullName}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {order.customer.phone}
                            </p>
                          </td>

                          <td className="px-6 py-5 font-semibold text-[#14532D]">
                            {formatCurrency(
                              order.productsTotal
                            )}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                order.status
                              )}`}
                            >
                              {formatStatus(
                                order.status
                              )}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-sm text-gray-500">
                            {formatDate(
                              order.createdAt
                            )}
                          </td>

                          <td className="px-6 py-5 text-right">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-[#14532D] transition hover:border-[#14532D] hover:bg-green-50"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="space-y-4 lg:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-[#1F2937]">
                          {order.orderNumber}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(
                            order.createdAt
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                          order.status
                        )}`}
                      >
                        {formatStatus(
                          order.status
                        )}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="font-semibold text-gray-800">
                        {order.customer.fullName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {order.customer.phone}
                      </p>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-400">
                          Products Total
                        </p>

                        <p className="mt-1 text-lg font-bold text-[#14532D]">
                          {formatCurrency(
                            order.productsTotal
                          )}
                        </p>
                      </div>

                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4224]"
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}