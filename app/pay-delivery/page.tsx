"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";

type PaymentAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
};

type PaymentData = {
  paymentType: "DELIVERY";

  order: {
    orderNumber: string;
    status: string;
    amount: number;
    deliveryFee: number | null;
    customerName: string;
    deliveryPreference: string;
  };

  accounts: PaymentAccount[];
};

function formatCurrency(
  amount: number | null
) {
  if (amount === null) {
    return "₦0";
  }

  return `₦${amount.toLocaleString(
    "en-NG"
  )}`;
}

function DeliveryPaymentContent() {
  const searchParams =
    useSearchParams();

  const orderNumber =
    searchParams.get("order") ||
    "";

  const phone =
    searchParams.get("phone") ||
    "";

  const [
    paymentData,
    setPaymentData,
  ] = useState<PaymentData | null>(
    null
  );

  const [
    paymentAccountId,
    setPaymentAccountId,
  ] = useState("");

  const [
    paymentReference,
    setPaymentReference,
  ] = useState("");

  const [
    evidence,
    setEvidence,
  ] = useState<File | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  useEffect(() => {
    async function loadPayment() {
      if (!orderNumber || !phone) {
        setError(
          "Order number and phone number are required."
        );
        setLoading(false);
        return;
      }

      try {
        const response =
          await fetch(
            `/api/orders/payment?order=${encodeURIComponent(
              orderNumber
            )}&phone=${encodeURIComponent(
              phone
            )}&type=DELIVERY`,
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
              "Unable to load delivery payment."
          );
        }

        setPaymentData(
          data
        );

        if (
          data.accounts?.length >
          0
        ) {
          setPaymentAccountId(
            data.accounts[0].id
          );
        }
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load delivery payment."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
  }, [
    orderNumber,
    phone,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!paymentData) {
      return;
    }

    if (!paymentAccountId) {
      setError(
        "Please select the bank account you paid into."
      );
      return;
    }

    if (!evidence) {
      setError(
        "Please upload your delivery payment receipt."
      );
      return;
    }

    try {
      setSubmitting(true);

      const formData =
        new FormData();

      formData.append(
        "orderNumber",
        orderNumber
      );

      formData.append(
        "phone",
        phone
      );

      formData.append(
        "paymentType",
        "DELIVERY"
      );

      formData.append(
        "paymentAccountId",
        paymentAccountId
      );

      formData.append(
        "paymentReference",
        paymentReference.trim()
      );

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
            "Unable to submit delivery payment."
        );
      }

      setSuccess(true);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit delivery payment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAF7]">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="text-4xl">
            🌿
          </div>

          <p className="mt-4 text-gray-500">
            Loading delivery payment...
          </p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#FAFAF7]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-3xl border border-green-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#1F2937]">
              Delivery Payment Submitted
            </h1>

            <p className="mt-4 leading-7 text-gray-600">
              Your delivery payment has been
              submitted successfully. Yetop will
              verify the payment and update your
              order.
            </p>

            <div className="mt-6 rounded-2xl bg-green-50 p-5">
              <p className="text-sm text-green-800">
                Order
              </p>

              <p className="mt-1 font-bold text-[#14532D]">
                {orderNumber}
              </p>
            </div>

            <Link
              href={`/track-order?order=${encodeURIComponent(
                orderNumber
              )}&phone=${encodeURIComponent(
                phone
              )}`}
              className="mt-7 inline-flex rounded-full bg-[#14532D] px-7 py-3.5 font-semibold text-white"
            >
              Back to Track Order
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (error && !paymentData) {
    return (
      <main className="min-h-screen bg-[#FAFAF7]">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-red-700">
              Unable to continue
            </h1>

            <p className="mt-3 text-gray-600">
              {error}
            </p>

            <Link
              href="/track-order"
              className="mt-6 inline-flex rounded-full bg-[#14532D] px-6 py-3 font-semibold text-white"
            >
              Back to Track Order
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/track-order?order=${encodeURIComponent(
            orderNumber
          )}&phone=${encodeURIComponent(
            phone
          )}`}
          className="text-sm font-semibold text-[#14532D]"
        >
          ← Back to Track Order
        </Link>

        <div className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
            Delivery Payment
          </p>

          <h1 className="mt-2 text-4xl font-bold text-[#1F2937]">
            Pay Your Delivery Fee
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            This payment is separate from the
            payment you made for your products.
          </p>
        </div>

        {/* Amount */}
        <div className="mt-8 rounded-3xl bg-[#14532D] p-7 text-white">
          <p className="text-sm text-green-100">
            Delivery Fee
          </p>

          <p className="mt-2 text-4xl font-bold">
            {formatCurrency(
              paymentData.order
                .deliveryFee
            )}
          </p>

          <p className="mt-3 text-sm text-green-100">
            Order:{" "}
            <span className="font-semibold text-white">
              {orderNumber}
            </span>
          </p>
        </div>

        {/* Bank accounts */}
        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-bold text-[#1F2937]">
            Make Your Bank Transfer
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Transfer exactly{" "}
            <strong>
              {formatCurrency(
                paymentData.order
                  .deliveryFee
              )}
            </strong>{" "}
            to one of the Yetop accounts below.
          </p>

          <div className="mt-6 space-y-4">
            {paymentData.accounts.map(
              (account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() =>
                    setPaymentAccountId(
                      account.id
                    )
                  }
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    paymentAccountId ===
                    account.id
                      ? "border-[#14532D] bg-green-50 ring-2 ring-[#14532D]/10"
                      : "border-gray-200 bg-white hover:border-[#14532D]"
                  }`}
                >
                  <p className="font-bold text-[#1F2937]">
                    {account.bankName}
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    Account Name:{" "}
                    <strong>
                      {account.accountName}
                    </strong>
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    Account Number:{" "}
                    <strong>
                      {account.accountNumber}
                    </strong>
                  </p>

                  {account.instructions && (
                    <p className="mt-3 text-xs leading-5 text-gray-500">
                      {
                        account.instructions
                      }
                    </p>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {/* Receipt */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-gray-200 bg-white p-7 shadow-sm"
        >
          <h2 className="text-xl font-bold text-[#1F2937]">
            Submit Delivery Payment
          </h2>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Payment Reference
              <span className="ml-1 font-normal text-gray-400">
                (Optional)
              </span>
            </label>

            <input
              type="text"
              value={paymentReference}
              onChange={(event) =>
                setPaymentReference(
                  event.target.value
                )
              }
              placeholder="Bank transfer reference"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Upload Payment Receipt
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(event) =>
                setEvidence(
                  event.target.files?.[0] ||
                    null
                )
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
            />

            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG or PDF. Maximum 5 MB.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full bg-[#14532D] px-6 py-4 font-bold text-white transition hover:bg-[#0f3d21] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Submitting Payment..."
              : "Submit Delivery Payment →"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function DeliveryPaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAFAF7]">
          <div className="py-20 text-center text-gray-500">
            Loading...
          </div>
        </main>
      }
    >
      <DeliveryPaymentContent />
    </Suspense>
  );
}