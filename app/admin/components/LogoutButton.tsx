"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch(
        "/api/admin/logout",
        {
          method: "POST",
        }
      );
    } finally {
      router.replace(
        "/admin/login"
      );
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading
        ? "Signing Out..."
        : "Logout"}
    </button>
  );
}