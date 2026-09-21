"use client";

import Link from "next/link";

type HeaderProps = {
  cartCount?: number;
  onCartClick?: () => void;
};

export default function Header({
  cartCount = 0,
  onCartClick,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-[#14532D]"
        >
          YETOP
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 transition hover:text-[#14532D]"
          >
            Home
          </Link>

          <Link
            href="/products"
            className="text-sm font-medium text-gray-600 transition hover:text-[#14532D]"
          >
            Products
          </Link>

          {/* Track Order */}
          <Link
            href="/track-order"
            className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-[#14532D] transition hover:bg-green-100"
          >
            Track Order
          </Link>

          <Link
            href="/#about"
            className="text-sm font-medium text-gray-600 transition hover:text-[#14532D]"
          >
            About
          </Link>

          <Link
            href="/#contact"
            className="text-sm font-medium text-gray-600 transition hover:text-[#14532D]"
          >
            Contact
          </Link>
        </nav>

        {/* Cart */}
        <button
          onClick={onCartClick}
          className="relative rounded-full bg-[#14532D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3d21]"
        >
          🛒 My Order

          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D4A72C] text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}