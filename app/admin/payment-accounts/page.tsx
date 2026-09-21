"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PaymentAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  displayOrder: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  instructions: "",
  displayOrder: "0",
  isActive: true,
};

export default function PaymentAccountsPage() {
  const [accounts, setAccounts] = useState<
    PaymentAccount[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/payment-accounts",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to load payment accounts."
        );
      }

      setAccounts(data.accounts || []);
    } catch (error) {
      console.error(
        "Failed to load payment accounts:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load payment accounts."
      );
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    account: PaymentAccount
  ) {
    setEditingId(account.id);

    setForm({
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber:
        account.accountNumber,
      instructions:
        account.instructions || "",
      displayOrder:
        String(account.displayOrder),
      isActive: account.isActive,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const bankName =
      form.bankName.trim();

    const accountName =
      form.accountName.trim();

    const accountNumber =
      form.accountNumber.trim();

    const instructions =
      form.instructions.trim();

    const displayOrder =
      Number(form.displayOrder);

    if (
      !bankName ||
      !accountName ||
      !accountNumber
    ) {
      setError(
        "Bank name, account name and account number are required."
      );
      return;
    }

    if (
      accountNumber.length < 6 ||
      accountNumber.length > 30
    ) {
      setError(
        "Please provide a valid account number."
      );
      return;
    }

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 0
    ) {
      setError(
        "Display order must be a whole number starting from 0."
      );
      return;
    }

    /*
     * Prevent accidentally removing the last
     * active payment account.
     */
    if (
      editingId &&
      !form.isActive
    ) {
      const activeAccounts =
        accounts.filter(
          (account) =>
            account.isActive
        );

      const isLastActiveAccount =
        activeAccounts.length === 1 &&
        activeAccounts[0].id ===
          editingId;

      if (isLastActiveAccount) {
        setError(
          "You cannot deactivate the last active payment account. Add another active account first."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        bankName,
        accountName,
        accountNumber,
        instructions,
        displayOrder,
        isActive: form.isActive,
      };

      const url = editingId
        ? `/api/admin/payment-accounts/${editingId}`
        : "/api/admin/payment-accounts";

      const response = await fetch(
        url,
        {
          method: editingId
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
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
            "Unable to save payment account."
        );
      }

      setSuccess(
        editingId
          ? "Payment account updated successfully."
          : "Payment account added successfully."
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadAccounts();
    } catch (error) {
      console.error(
        "Failed to save payment account:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save payment account."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAccount(
    account: PaymentAccount
  ) {
    const activeAccounts =
      accounts.filter(
        (item) => item.isActive
      );

    if (
      account.isActive &&
      activeAccounts.length === 1
    ) {
      setError(
        "You cannot deactivate the last active payment account. Add another active account first."
      );
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/payment-accounts/${account.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            isActive:
              !account.isActive,
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
            "Unable to update payment account."
        );
      }

      setSuccess(
        account.isActive
          ? "Payment account deactivated."
          : "Payment account activated."
      );

      await loadAccounts();
    } catch (error) {
      console.error(
        "Failed to toggle payment account:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to update payment account."
      );
    }
  }

  function maskAccountNumber(
    accountNumber: string
  ) {
    if (accountNumber.length <= 4) {
      return accountNumber;
    }

    return `•••• ${accountNumber.slice(-4)}`;
  }

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
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-[#14532D] transition hover:bg-green-50"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Page heading */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
              Settings
            </p>

            <h1 className="mt-2 text-4xl font-bold text-[#1F2937]">
              Payment Accounts
            </h1>

            <p className="mt-3 max-w-2xl text-gray-500">
              Manage the bank accounts customers can
              use when making payments for approved
              orders.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="rounded-full bg-[#14532D] px-6 py-3 font-semibold text-white transition hover:bg-[#0f3d21]"
          >
            + Add Payment Account
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm leading-6 text-green-800">
            {success}
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                  {editingId
                    ? "Edit Account"
                    : "New Account"}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#1F2937]">
                  {editingId
                    ? "Update payment account"
                    : "Add payment account"}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  These details will be displayed to
                  customers during payment.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="text-2xl text-gray-400 transition hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7"
            >
              <div className="grid gap-5 md:grid-cols-2">
                {/* Bank */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Bank Name *
                  </label>

                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        bankName:
                          event.target.value,
                      })
                    }
                    placeholder="e.g. First Bank"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* Account Name */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Account Name *
                  </label>

                  <input
                    type="text"
                    value={form.accountName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        accountName:
                          event.target.value,
                      })
                    }
                    placeholder="e.g. Yetunde Balogun"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Account Number *
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.accountNumber}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        accountNumber:
                          event.target.value,
                      })
                    }
                    placeholder="Enter account number"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Display Order
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      form.displayOrder
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        displayOrder:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Lower numbers appear first.
                  </p>
                </div>

                {/* Instructions */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Payment Instructions
                    <span className="ml-2 font-normal text-gray-400">
                      Optional
                    </span>
                  </label>

                  <textarea
                    value={
                      form.instructions
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        instructions:
                          event.target.value,
                      })
                    }
                    rows={4}
                    placeholder="e.g. Please use your order number as the payment reference."
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 outline-none transition focus:border-[#14532D] focus:ring-2 focus:ring-green-100"
                  />
                </div>

                {/* Active */}
                <div className="md:col-span-2">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        form.isActive
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          isActive:
                            event.target.checked,
                        })
                      }
                      className="h-5 w-5 rounded border-gray-300 accent-[#14532D]"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-gray-800">
                        Active payment account
                      </span>

                      <span className="block text-xs text-gray-500">
                        Customers can use this account
                        when it is active.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#14532D] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3d21] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Account"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Accounts */}
        <section className="mt-8">
          {loading ? (
            <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <div className="text-3xl">
                ⏳
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Loading payment accounts...
              </p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <div className="text-5xl">
                💳
              </div>

              <h2 className="mt-4 text-xl font-bold text-gray-800">
                No payment accounts yet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Add a bank account so approved customers
                know where to make payment.
              </p>

              <button
                type="button"
                onClick={openAddForm}
                className="mt-6 rounded-full bg-[#14532D] px-6 py-3 text-sm font-semibold text-white"
              >
                + Add First Account
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-xl">
                        🏦
                      </div>

                      <div>
                        <h2 className="font-bold text-[#1F2937]">
                          {account.bankName}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {account.accountName}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        account.isActive
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 bg-gray-50 text-gray-500"
                      }`}
                    >
                      {account.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-6 rounded-2xl bg-[#FAFAF7] p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Account Number
                    </p>

                    <p className="mt-2 text-xl font-bold tracking-wider text-[#14532D]">
                      {maskAccountNumber(
                        account.accountNumber
                      )}
                    </p>
                  </div>

                  {account.instructions && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Instructions
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {account.instructions}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(
                          account
                        )
                      }
                      className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#14532D] transition hover:bg-green-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleAccount(
                          account
                        )
                      }
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                        account.isActive
                          ? "border border-red-200 text-red-600 hover:bg-red-50"
                          : "bg-[#14532D] text-white hover:bg-[#0f3d21]"
                      }`}
                    >
                      {account.isActive
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <span className="ml-auto text-xs text-gray-400">
                      Order:{" "}
                      {account.displayOrder}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}