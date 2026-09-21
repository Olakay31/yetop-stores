"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/admin/login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to sign in."
        );
      }

      router.push(
        "/admin/dashboard"
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
      <div className="flex min-h-screen">

        <section className="hidden w-1/2 bg-[#14532D] lg:flex">
          <div className="flex w-full flex-col justify-between p-12 text-white">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl">
                  🌿
                </div>

                <div>
                  <p className="text-xl font-bold">
                    YETOP STORES
                  </p>

                  <p className="text-sm text-green-100">
                    Wholesale Management
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-lg">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                Admin Portal
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Manage your wholesale business with confidence.
              </h1>

              <p className="mt-6 text-lg leading-8 text-green-100">
                Manage orders, products, inventory,
                customers and payments from one secure
                workspace.
              </p>
            </div>

            <p className="text-sm text-green-200">
              © {new Date().getFullYear()} Yetop Stores
            </p>
          </div>
        </section>

        <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
          <div className="w-full max-w-md">

            <div className="mb-10 text-center lg:hidden">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">
                🌿
              </div>

              <h1 className="mt-4 text-2xl font-bold text-[#14532D]">
                YETOP STORES
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Admin Portal
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-bold text-[#1F2937]">
                Admin Sign In
              </h2>

              <p className="mt-3 text-gray-500">
                Sign in to manage your Yetop Stores
                operations.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="admin@yetopstores.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 pr-20 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#14532D] focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-semibold text-[#14532D] hover:bg-green-50"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#14532D] px-6 py-4 font-bold text-white transition hover:bg-[#0f3d21] focus:outline-none focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
              <p className="text-sm leading-6 text-yellow-800">
                <span className="font-bold">
                  Admin access only.
                </span>{" "}
                This area is restricted to authorized
                Yetop Stores administrators.
              </p>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}