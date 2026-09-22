"use client";

import {
    Suspense,
    useEffect,
    useState,
  } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

type PaymentAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  displayOrder: number;
};

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  productsTotal: string;
  deliveryFee: string | null;
  grandTotal: string | null;
  deliveryPaymentMethod: string;
  customerName: string;
};

function formatMoney(
  value: string | number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "To be confirmed";
  }

  return `₦${Number(value).toLocaleString(
    "en-NG"
  )}`;
}

function PayOrderPageContent() {
  const searchParams =
    useSearchParams();

    const orderFromUrl =
    searchParams.get("order") || "";
  
  const phoneFromUrl =
    searchParams.get("phone") || "";
  
  const [orderNumber, setOrderNumber] =
    useState(orderFromUrl);
  
  const [phone, setPhone] =
    useState(phoneFromUrl);

  const [order, setOrder] =
    useState<OrderData | null>(null);

  const [accounts, setAccounts] =
    useState<PaymentAccount[]>([]);

  const [selectedAccountId, setSelectedAccountId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [searched, setSearched] =
    useState(false);

  const [paymentReference, setPaymentReference] =
    useState("");

  const [evidence, setEvidence] =
    useState<File | null>(null);

  const [paymentSubmitted, setPaymentSubmitted] =
    useState(false);

  const [submittedPaymentReference, setSubmittedPaymentReference] =
    useState<string | null>(null);

  /*
   * Keep URL values in state.
   */
  useEffect(() => {
    if (orderFromUrl) {
      setOrderNumber(orderFromUrl);
    }

    if (phoneFromUrl) {
      setPhone(phoneFromUrl);
    }
  }, [orderFromUrl, 
    phoneFromUrl]);

  /*
   * Load payment details.
   *
   * Optional values allow the page to automatically
   * load when the customer arrives from Track Order.
   */
  async function loadPaymentDetails(
    event?: React.FormEvent,
    lookupOrderNumber?: string,
    lookupPhone?: string
  ) {
    event?.preventDefault();

    setError("");
    setOrder(null);
    setAccounts([]);
    setSelectedAccountId("");
    setPaymentSubmitted(false);
    setSearched(true);

    const cleanOrderNumber =
      (
        lookupOrderNumber ??
        orderNumber
      ).trim();

    const cleanPhone =
      (
        lookupPhone ??
        phone
      ).trim();

    if (
      !cleanOrderNumber ||
      !cleanPhone
    ) {
      setError(
        "Please enter your order number and phone number."
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `/api/orders/payment?orderNumber=${encodeURIComponent(
            cleanOrderNumber
          )}&phone=${encodeURIComponent(
            cleanPhone
          )}`,
          {
            cache: "no-store",
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
            "Unable to load payment details."
        );
      }

      setOrder(data.order);
      setAccounts(data.accounts);

      /*
       * Automatically select the first account
       * according to the admin-defined display order.
       */
      if (
        data.accounts?.length > 0
      ) {
        setSelectedAccountId(
          data.accounts[0].id
        );
      }
    } catch (error) {
      console.error(
        "Payment lookup failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load payment details."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Automatically load the order when coming
   * from Track Order with order + phone in URL.
   */
  useEffect(() => {
    if (
      orderFromUrl &&
      phoneFromUrl
    ) {
      void loadPaymentDetails(
        undefined,
        orderFromUrl,
        phoneFromUrl
      );
    }

    // We intentionally run this only when the
    // URL order/phone values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orderFromUrl,
    phoneFromUrl,
  ]);

  /*
   * Handle receipt selection.
   */
  function handleEvidenceChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] || null;

    setError("");

    if (!file) {
      setEvidence(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setEvidence(null);

      event.target.value = "";

      setError(
        "Payment evidence must be JPG, PNG or PDF."
      );

      return;
    }

    const maxFileSize =
      5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      setEvidence(null);

      event.target.value = "";

      setError(
        "Payment evidence must not exceed 5 MB."
      );

      return;
    }

    setEvidence(file);
  }

  /*
   * Submit payment evidence.
   */
  async function handleSubmitPayment(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (!order) {
      setError(
        "Please load your order first."
      );
      return;
    }

    if (!selectedAccountId) {
      setError(
        "Please select the payment account you used."
      );
      return;
    }

    if (!evidence) {
      setError(
        "Please upload your payment receipt."
      );
      return;
    }

    try {
      setSubmitting(true);

      const formData =
        new FormData();

      formData.append(
        "orderNumber",
        order.orderNumber
      );

      formData.append(
        "phone",
        phone.trim()
      );

      formData.append(
        "paymentAccountId",
        selectedAccountId
      );

      if (
        paymentReference.trim()
      ) {
        formData.append(
          "paymentReference",
          paymentReference.trim()
        );
      }

      formData.append(
        "evidence",
        evidence
      );

      const response =
        await fetch(
          "/api/orders/payment",
          {
            method: "POST",
            body: formData,
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
            "Unable to submit payment."
        );
      }

      setPaymentSubmitted(true);

      setSubmittedPaymentReference(
        data.payment
          ?.paymentReference || null
      );

      setEvidence(null);
      setPaymentReference("");
    } catch (error) {
      console.error(
        "Payment submission failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAccount =
    accounts.find(
      (account) =>
        account.id ===
        selectedAccountId
    );

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Header />

      {/* Hero */}
      <section className="bg-[#14532D] px-6 py-14 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-200">
            Secure Payment
          </p>

          <h1 className="mt-3 text-4xl font-bold md:text-5xl">
            Complete Your Payment
          </h1>

          <p className="mt-4 max-w-2xl text-green-100">
            Enter your order details to view the
            payment accounts available for your
            approved order.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Lookup */}
        {!order && (
          <section className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-[#1F2937]">
              Find Your Order
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter the order number and the phone
              number used when placing the order.
            </p>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={
                loadPaymentDetails
              }
              className="mt-7 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Order Number
                </label>

                <input
                  type="text"
                  value={
                    orderNumber
                  }
                  onChange={(event) =>
                    setOrderNumber(
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="e.g. YETF2MSR"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 font-semibold uppercase outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 08060002626"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#14532D] px-6 py-3.5 font-semibold text-white transition hover:bg-[#0f3d21] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Checking Order..."
                  : "Continue to Payment"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/track-order"
                className="text-sm font-semibold text-[#14532D] hover:underline"
              >
                ← Track another order
              </Link>
            </div>
          </section>
        )}

        {/* Payment Details */}
        {order && (
          <div className="space-y-7">
            {/* Order summary */}
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Approved Order
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-[#14532D]">
                    {order.orderNumber}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {order.customerName}
                  </p>
                </div>

                <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">
                  AWAITING PAYMENT
                </span>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#FAFAF7] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Products
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-800">
                    {formatMoney(
                      order.productsTotal
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FAFAF7] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Delivery
                  </p>

                  <p className="mt-2 text-xl font-bold text-gray-800">
                    {formatMoney(
                      order.deliveryFee
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                    Total
                  </p>

                  <p className="mt-2 text-xl font-bold text-[#14532D]">
                    {formatMoney(
                      order.grandTotal
                    )}
                  </p>
                </div>
              </div>

              {order.deliveryPaymentMethod ===
                "PAY_ON_DELIVERY" && (
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-800">
                  Your delivery fee is set to Pay on
                  Delivery. The payment below is for
                  your approved order amount.
                </div>
              )}
            </section>

            {/* Payment accounts */}
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                  Payment Accounts
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#1F2937]">
                  Choose where you paid
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Select the bank account you used to
                  make your payment.
                </p>
              </div>

              <div className="mt-7 grid gap-4">
                {accounts.map(
                  (account) => {
                    const selected =
                      account.id ===
                      selectedAccountId;

                    return (
                      <button
                        key={
                          account.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedAccountId(
                            account.id
                          )
                        }
                        className={`w-full rounded-2xl border p-5 text-left transition ${
                          selected
                            ? "border-[#14532D] bg-green-50 ring-2 ring-green-100"
                            : "border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/40"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[#14532D] bg-[#14532D]"
                                : "border-gray-300"
                            }`}
                          >
                            {selected && (
                              <div className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <h3 className="font-bold text-gray-800">
                                {
                                  account.bankName
                                }
                              </h3>

                              <span className="text-xs font-semibold text-gray-400">
                                Account{" "}
                                {account.displayOrder +
                                  1}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-500">
                              {
                                account.accountName
                              }
                            </p>

                            <p className="mt-3 text-xl font-bold tracking-wider text-[#14532D]">
                              {
                                account.accountNumber
                              }
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Selected account instructions */}
              {selectedAccount?.instructions && (
                <div className="mt-6 rounded-2xl border border-yellow-100 bg-yellow-50 px-5 py-4">
                  <p className="text-sm font-bold text-yellow-800">
                    Payment Instructions
                  </p>

                  <p className="mt-2 text-sm leading-6 text-yellow-700">
                    {
                      selectedAccount.instructions
                    }
                  </p>
                </div>
              )}
            </section>

            {/* Payment submission */}
            <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                Payment Confirmation
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#1F2937]">
                Submit your payment details
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                After making payment, upload your
                receipt so Yetop Stores can verify it.
              </p>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              {paymentSubmitted ? (
                <div className="mt-7 rounded-3xl border border-green-200 bg-green-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#14532D] text-xl text-white">
                      ✓
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#14532D]">
                        Payment Submitted Successfully
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-green-800">
                        Your payment evidence has been
                        received and is now awaiting
                        verification by Yetop Stores.
                      </p>

                      <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm">
                        <p className="font-semibold text-gray-700">
                          Order Number
                        </p>

                        <p className="mt-1 font-bold text-[#14532D]">
                          {order.orderNumber}
                        </p>

                        {submittedPaymentReference && (
                          <div className="mt-3">
                            <p className="font-semibold text-gray-700">
                              Payment Reference
                            </p>

                            <p className="mt-1 text-gray-600">
                              {
                                submittedPaymentReference
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-xs leading-5 text-green-700">
                        Please do not submit another payment
                        for this order unless Yetop Stores
                        asks you to do so.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={
                    handleSubmitPayment
                  }
                  className="mt-7 space-y-6"
                >
                  {/* Payment reference */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Payment Reference{" "}
                      <span className="font-normal text-gray-400">
                        (Optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      value={
                        paymentReference
                      }
                      onChange={(event) =>
                        setPaymentReference(
                          event.target.value
                        )
                      }
                      placeholder="e.g. bank transfer reference"
                      disabled={
                        submitting
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Enter the transaction reference
                      shown by your bank, if available.
                    </p>
                  </div>

                  {/* Receipt upload */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Payment Receipt
                    </label>

                    <label
                      className={`block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                        submitting
                          ? "cursor-not-allowed border-gray-200 bg-gray-100"
                          : "border-gray-300 bg-[#FAFAF7] hover:border-[#14532D] hover:bg-green-50"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={
                          handleEvidenceChange
                        }
                        disabled={
                          submitting
                        }
                        className="hidden"
                      />

                      <div className="text-4xl">
                        📎
                      </div>

                      {evidence ? (
                        <>
                          <p className="mt-3 font-semibold text-[#14532D]">
                            {evidence.name}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {(
                              evidence.size /
                              1024 /
                              1024
                            ).toFixed(
                              2
                            )}{" "}
                            MB
                          </p>

                          <p className="mt-3 text-xs font-semibold text-[#14532D]">
                            Click to choose a different
                            file
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mt-3 font-semibold text-gray-700">
                            Upload Payment Receipt
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Click here to choose your receipt
                          </p>

                          <p className="mt-3 text-xs text-gray-400">
                            JPG, PNG or PDF • Maximum 5 MB
                          </p>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !selectedAccountId ||
                      !evidence
                    }
                    className="w-full rounded-full bg-[#14532D] px-6 py-4 font-semibold text-white transition hover:bg-[#0f3d21] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting Payment..."
                      : "Submit Payment for Verification"}
                  </button>

                  <p className="text-center text-xs leading-5 text-gray-400">
                    Your payment receipt will be securely
                    submitted to Yetop Stores for verification.
                  </p>
                </form>
              )}
            </section>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setAccounts([]);
                  setSelectedAccountId(
                    ""
                  );
                  setError("");
                  setEvidence(null);
                  setPaymentReference("");
                  setPaymentSubmitted(false);
                }}
                className="text-sm font-semibold text-[#14532D] hover:underline"
              >
                ← Use a different order
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function PayOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF7]">
          <Header />

          <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#14532D]" />

              <p className="mt-4 text-sm font-medium text-gray-500">
                Loading payment page...
              </p>
            </div>
          </main>

          <Footer />
        </div>
      }
    >
      <PayOrderPageContent />
    </Suspense>
  );
}