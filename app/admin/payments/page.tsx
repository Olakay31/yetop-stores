"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Payment = {
  id: string;
  status: string;
  amount: string | number;
  paymentReference: string | null;
  evidenceUrl: string | null;
  evidencePath: string | null;
  adminNote: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;

  order: {
    id: string;
    orderNumber: string;
    status: string;
    productsTotal: string | number;
    deliveryFee: string | number | null;
    grandTotal: string | number | null;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryState: string;
  } | null;

  customer: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  } | null;

  paymentAccount: {
    id: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions: string | null;
  } | null;

  paidTo: {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
  };
};

type Summary = {
  totalPayments: number;
  pending: number;
  verified: number;
  rejected: number;
};

function formatCurrency(
  value: string | number | null | undefined
) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusStyle(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";

    case "VERIFIED":
      return "bg-green-100 text-green-800";

    case "REJECTED":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function isPdf(path: string | null) {
  return Boolean(
    path?.toLowerCase().endsWith(".pdf")
  );
}

function isImage(path: string | null) {
  if (!path) return false;

  const lowerPath = path.toLowerCase();

  return (
    lowerPath.endsWith(".png") ||
    lowerPath.endsWith(".jpg") ||
    lowerPath.endsWith(".jpeg") ||
    lowerPath.endsWith(".webp")
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  const [summary, setSummary] = useState<Summary>({
    totalPayments: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");

  const [selectedPayment, setSelectedPayment] =
    useState<Payment | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [actionError, setActionError] =
    useState("");

  const [showRejectBox, setShowRejectBox] =
    useState(false);

  const [rejectReason, setRejectReason] =
    useState("");

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/payments",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to load payments."
        );
      }

      setPayments(
        Array.isArray(data.payments)
          ? data.payments
          : []
      );

      setSummary(
        data.summary || {
          totalPayments: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
        }
      );
    } catch (err) {
      console.error(
        "Failed to load admin payments:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function handleVerifyPayment() {
    if (!selectedPayment) return;

    const confirmed = window.confirm(
      `Are you sure you want to verify payment for order ${selectedPayment.order?.orderNumber || ""}?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      setActionError("");

      const response = await fetch(
        `/api/admin/payments/${encodeURIComponent(
          selectedPayment.id
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "VERIFY",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to verify payment."
        );
      }

      setSelectedPayment(null);

      setShowRejectBox(false);
      setRejectReason("");

      await loadPayments();

      window.alert(
        "Payment verified successfully."
      );
    } catch (err) {
      console.error(
        "Payment verification failed:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to verify payment."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleRejectPayment() {
    if (!selectedPayment) return;

    const reason = rejectReason.trim();

    if (!reason) {
      setActionError(
        "Please provide a reason for rejecting the payment."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to reject the payment for order ${selectedPayment.order?.orderNumber || ""}?`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      setActionError("");

      const response = await fetch(
        `/api/admin/payments/${encodeURIComponent(
          selectedPayment.id
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "REJECT",
            adminNote: reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to reject payment."
        );
      }

      setSelectedPayment(null);

      setShowRejectBox(false);
      setRejectReason("");

      await loadPayments();

      window.alert(
        "Payment rejected successfully."
      );
    } catch (err) {
      console.error(
        "Payment rejection failed:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to reject payment."
      );
    } finally {
      setProcessing(false);
    }
  }

  function closeModal() {
    if (processing) return;

    setSelectedPayment(null);
    setShowRejectBox(false);
    setRejectReason("");
    setActionError("");
  }

  const filteredPayments =
    filter === "ALL"
      ? payments
      : payments.filter(
          (payment) =>
            payment.status === filter
        );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Payment Verification
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Review customer payments, receipts and
              verification status.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPayments}
            disabled={loading || processing}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Payments
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {summary.totalPayments}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending Verification
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-600">
              {summary.pending}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Verified
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {summary.verified}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Rejected
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {summary.rejected}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {[
              ["ALL", "All Payments"],
              ["PENDING", "Pending"],
              ["VERIFIED", "Verified"],
              ["REJECTED", "Rejected"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  filter === value
                    ? "bg-green-700 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Payment list */}
        <section className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-gray-900">
              Payment Submissions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredPayments.length} payment
              {filteredPayments.length === 1
                ? ""
                : "s"} found.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Loading payments...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-gray-700">
                No payments found.
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Customer payment submissions will appear
                here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="px-6 py-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-gray-900">
                          {payment.order
                            ?.orderNumber || "—"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="text-gray-500">
                            Customer
                          </span>

                          <p className="font-medium text-gray-900">
                            {payment.customer
                              ?.fullName ||
                              payment.order
                                ?.customerName ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">
                            Phone
                          </span>

                          <p className="font-medium text-gray-900">
                            {payment.customer?.phone ||
                              payment.order
                                ?.customerPhone ||
                              "—"}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">
                            Amount
                          </span>

                          <p className="font-bold text-green-700">
                            {formatCurrency(
                              payment.amount
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-500">
                            Submitted
                          </span>

                          <p className="font-medium text-gray-900">
                            {formatDate(
                              payment.submittedAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPayment(
                          payment
                        )
                      }
                      className="shrink-0 rounded-lg border border-green-700 px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-700 hover:text-white"
                    >
                      Review Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Review modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Review Payment
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Order{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedPayment.order
                      ?.orderNumber || "—"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close payment review"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Action error */}
              {actionError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {actionError}
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Payment Status
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedPayment.status}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                    selectedPayment.status
                  )}`}
                >
                  {selectedPayment.status}
                </span>
              </div>

              {/* Payment information */}
              <section>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Payment Information
                </h3>

                <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      Amount Paid
                    </p>

                    <p className="mt-1 text-lg font-bold text-green-700">
                      {formatCurrency(
                        selectedPayment.amount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Payment Reference
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {selectedPayment.paymentReference ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Submitted
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(
                        selectedPayment.submittedAt
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Verified
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(
                        selectedPayment.verifiedAt
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* Customer */}
              <section>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Customer
                </h3>

                <div className="rounded-xl border p-4">
                  <p className="font-semibold text-gray-900">
                    {selectedPayment.customer
                      ?.fullName ||
                      selectedPayment.order
                        ?.customerName ||
                      "—"}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {selectedPayment.customer?.phone ||
                      selectedPayment.order
                        ?.customerPhone ||
                      "—"}
                  </p>

                  {(selectedPayment.customer
                    ?.email ||
                    selectedPayment.order
                      ?.customerEmail) && (
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedPayment.customer?.email ||
                        selectedPayment.order
                          ?.customerEmail}
                    </p>
                  )}
                </div>
              </section>

              {/* Paid To */}
              <section>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Paid To
                </h3>

                <div className="rounded-xl border p-4">
                  {selectedPayment.paidTo
                    ?.bankName ||
                  selectedPayment.paymentAccount ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-gray-500">
                          Bank
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {selectedPayment.paidTo
                            ?.bankName ||
                            selectedPayment
                              .paymentAccount
                              ?.bankName ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Account Name
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {selectedPayment.paidTo
                            ?.accountName ||
                            selectedPayment
                              .paymentAccount
                              ?.accountName ||
                            "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          Account Number
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {selectedPayment.paidTo
                            ?.accountNumber ||
                            selectedPayment
                              .paymentAccount
                              ?.accountNumber ||
                            "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Payment account information unavailable.
                    </p>
                  )}

                  {selectedPayment.paymentAccount
                    ?.instructions && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-medium text-gray-500">
                        Payment Instructions
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {
                          selectedPayment
                            .paymentAccount
                            .instructions
                        }
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Order information */}
              <section>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Order Information
                </h3>

                <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      Order Status
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedPayment.order
                        ?.status || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Products Total
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {formatCurrency(
                        selectedPayment.order
                          ?.productsTotal
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Delivery Fee
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {selectedPayment.order
                        ?.deliveryFee != null
                        ? formatCurrency(
                            selectedPayment
                              .order
                              .deliveryFee
                          )
                        : "Pending"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Grand Total
                    </p>

                    <p className="mt-1 font-bold text-green-700">
                      {selectedPayment.order
                        ?.grandTotal != null
                        ? formatCurrency(
                            selectedPayment.order
                              .grandTotal
                          )
                        : formatCurrency(
                            selectedPayment.amount
                          )}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">
                      Delivery Address
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {selectedPayment.order
                        ?.deliveryAddress ||
                        "—"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {selectedPayment.order
                        ?.deliveryCity || "—"}
                      {selectedPayment.order
                        ?.deliveryState
                        ? `, ${selectedPayment.order.deliveryState}`
                        : ""}
                    </p>
                  </div>
                </div>
              </section>

              {/* Payment evidence */}
              <section>
                <h3 className="mb-3 font-semibold text-gray-900">
                  Payment Evidence
                </h3>

                {selectedPayment.evidenceUrl ? (
                  <div className="overflow-hidden rounded-xl border bg-gray-50">
                    <div className="border-b px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">
                        Uploaded Payment Receipt
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Secure evidence from Supabase
                        Storage.
                      </p>
                    </div>

                    <div className="p-4">
                      {isImage(
                        selectedPayment.evidencePath
                      ) ? (
                        <div className="rounded-xl border bg-white p-2">
                          <img
                            src={
                              selectedPayment.evidenceUrl
                            }
                            alt="Customer payment receipt"
                            className="mx-auto max-h-[550px] w-auto max-w-full rounded-lg object-contain"
                          />
                        </div>
                      ) : isPdf(
                          selectedPayment.evidencePath
                        ) ? (
                        <div className="rounded-xl border bg-white p-8 text-center">
                          <div className="text-5xl">
                            📄
                          </div>

                          <p className="mt-3 font-semibold text-gray-900">
                            PDF Payment Receipt
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Open the receipt to view
                            the uploaded PDF.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border bg-white p-8 text-center">
                          <div className="text-4xl">
                            🧾
                          </div>

                          <p className="mt-3 font-semibold text-gray-900">
                            Payment Evidence
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Open the uploaded file to
                            view the receipt.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={
                            selectedPayment.evidenceUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                        >
                          Open Receipt
                        </a>

                        <a
                          href={
                            selectedPayment.evidenceUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          View Full Size
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm font-medium text-yellow-800">
                      No payment evidence is available.
                    </p>

                    {selectedPayment.evidencePath && (
                      <p className="mt-2 break-all text-xs text-yellow-700">
                        Stored file:{" "}
                        {
                          selectedPayment.evidencePath
                        }
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Rejection reason */}
              {showRejectBox &&
                selectedPayment.status ===
                  "PENDING" && (
                  <section className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <label
                      htmlFor="rejectReason"
                      className="text-sm font-semibold text-red-900"
                    >
                      Reason for Rejection
                    </label>

                    <textarea
                      id="rejectReason"
                      value={rejectReason}
                      onChange={(event) => {
                        setRejectReason(
                          event.target.value
                        );
                        setActionError("");
                      }}
                      disabled={processing}
                      rows={4}
                      placeholder="Enter why this payment is being rejected..."
                      className="mt-2 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                    />

                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectBox(
                            false
                          );
                          setRejectReason("");
                          setActionError("");
                        }}
                        disabled={processing}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleRejectPayment
                        }
                        disabled={processing}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processing
                          ? "Rejecting..."
                          : "Confirm Rejection"}
                      </button>
                    </div>
                  </section>
                )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-20 flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={processing}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

              {selectedPayment.status ===
                "PENDING" &&
                !showRejectBox && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setShowRejectBox(true)
                      }
                      disabled={processing}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject Payment
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleVerifyPayment
                      }
                      disabled={processing}
                      className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processing
                        ? "Processing..."
                        : "Verify Payment"}
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}