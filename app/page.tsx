"use client";

import { useState } from "react";

const categories = [
  {
    name: "Herbs",
    description: "Natural herbal products",
    icon: "🌿",
  },
  {
    name: "Tea",
    description: "Herbal teas & blends",
    icon: "🍵",
  },
  {
    name: "Soap",
    description: "Herbal & natural soaps",
    icon: "🧼",
  },
  {
    name: "Cream",
    description: "Herbal creams & care",
    icon: "🧴",
  },
  {
    name: "Powder",
    description: "Natural herbal powders",
    icon: "🥄",
  },
  {
    name: "Spiritual Products",
    description: "Spiritual & wellness",
    icon: "✨",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((current) => !current);
  }

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#1F2937]">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-3"
            onClick={closeMobileMenu}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#14532D] text-xl">
              🌿
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide text-[#14532D]">
                YETOP
              </h1>

              <p className="-mt-1 text-[10px] font-medium tracking-[0.3em] text-gray-500">
                STORES
              </p>
            </div>
          </a>

          {/* ================= DESKTOP NAVIGATION ================= */}
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="/"
              className="font-medium text-[#14532D]"
            >
              Home
            </a>

            <a
              href="#categories"
              className="font-medium text-gray-600 transition hover:text-[#14532D]"
            >
              Categories
            </a>

            <a
              href="/products"
              className="font-medium text-gray-600 transition hover:text-[#14532D]"
            >
              Shop
            </a>

            <a
              href="/track-order"
              className="rounded-full bg-green-50 px-4 py-2 font-semibold text-[#14532D] transition hover:bg-green-100"
            >
              Track Order
            </a>

            <a
              href="#about"
              className="font-medium text-gray-600 transition hover:text-[#14532D]"
            >
              About Us
            </a>

            <a
              href="#contact"
              className="font-medium text-gray-600 transition hover:text-[#14532D]"
            >
              Contact
            </a>
          </nav>

          {/* ================= RIGHT SIDE ================= */}
          <div className="flex items-center gap-3">

            {/* Cart */}
            <button
              type="button"
              aria-label="Shopping cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#FAFAF7] text-xl transition hover:bg-green-50"
            >
              🛒

              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#14532D] text-[10px] font-bold text-white">
                0
              </span>
            </button>

            {/* ================= MOBILE MENU BUTTON ================= */}
            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? "Close menu"
                  : "Open menu"
              }
              aria-expanded={mobileMenuOpen}
              onPointerUp={(event) => {
                event.preventDefault();
                toggleMobileMenu();
              }}
              className="relative z-[60] flex h-12 w-12 shrink-0 cursor-pointer touch-manipulation select-none items-center justify-center rounded-full bg-[#14532D] text-2xl font-bold text-white transition active:scale-95 hover:bg-[#0F3D21] md:hidden"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>

          </div>
        </div>

        {/* ================= MOBILE NAVIGATION ================= */}
        {mobileMenuOpen && (
          <div className="relative z-[55] border-t border-gray-100 bg-white shadow-lg md:hidden">
            <nav className="mx-auto max-w-7xl px-5 py-4">

              <div className="flex flex-col">

                {/* Home */}
                <a
                  href="/"
                  onClick={closeMobileMenu}
                  className="border-b border-gray-100 py-4 text-sm font-semibold text-[#14532D]"
                >
                  Home
                </a>

                {/* Categories */}
                <a
                  href="#categories"
                  onClick={closeMobileMenu}
                  className="border-b border-gray-100 py-4 text-sm font-medium text-gray-700 transition hover:text-[#14532D]"
                >
                  Categories
                </a>

                {/* Shop */}
                <a
                  href="/products"
                  onClick={closeMobileMenu}
                  className="border-b border-gray-100 py-4 text-sm font-medium text-gray-700 transition hover:text-[#14532D]"
                >
                  Shop
                </a>

                {/* Track Order */}
                <a
                  href="/track-order"
                  onClick={closeMobileMenu}
                  className="border-b border-gray-100 py-4 text-sm font-semibold text-[#14532D]"
                >
                  📦 Track Order
                </a>

                {/* About */}
                <a
                  href="#about"
                  onClick={closeMobileMenu}
                  className="border-b border-gray-100 py-4 text-sm font-medium text-gray-700 transition hover:text-[#14532D]"
                >
                  About Us
                </a>

                {/* Contact */}
                <a
                  href="#contact"
                  onClick={closeMobileMenu}
                  className="py-4 text-sm font-medium text-gray-700 transition hover:text-[#14532D]"
                >
                  Contact
                </a>

              </div>

              {/* Mobile Order Button */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <a
                  href="/products"
                  onClick={closeMobileMenu}
                  className="flex w-full items-center justify-center rounded-full bg-[#14532D] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0F3D21]"
                >
                  🛒 Start an Order
                </a>
              </div>

            </nav>
          </div>
        )}
      </header>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-[#FAFAF7]">

        {/* Decorative background */}
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-green-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">

          {/* Hero Text */}
          <div className="max-w-2xl">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-[#14532D]">
              <span>🌿</span>
              Trusted Wholesale Partner
            </div>

            <h2 className="text-4xl font-bold leading-tight tracking-tight text-[#14532D] sm:text-5xl lg:text-6xl">
              Quality Products.
              <span className="mt-2 block text-[#22C55E]">
                Simple Ordering.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Discover quality herbal products and wholesale goods from
              Yetop Stores. Browse our products, place your order and let us
              handle the rest.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">

              <a
                href="/products"
                className="rounded-full bg-[#14532D] px-8 py-4 font-semibold text-white shadow-lg shadow-green-900/20 transition hover:-translate-y-0.5 hover:bg-[#0F3D21]"
              >
                Shop Products
              </a>

              <a
                href="/products"
                className="rounded-full border-2 border-[#14532D] px-8 py-4 font-semibold text-[#14532D] transition hover:bg-green-50"
              >
                Browse Categories
              </a>

            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-gray-600">

              <span className="flex items-center gap-2">
                <span className="font-bold text-[#22C55E]">✓</span>
                Wholesale Pricing
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-[#22C55E]">✓</span>
                Quality Products
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-[#22C55E]">✓</span>
                Easy Ordering
              </span>

            </div>

          </div>

          {/* Hero Image Placeholder */}
          <div className="relative">

            <div className="relative min-h-[400px] overflow-hidden rounded-[2rem] bg-[#14532D] shadow-2xl">

              {/* Decorative circles */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#22C55E]/30" />

              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#D4A72C]/20" />

              {/* Placeholder */}
              <div className="relative flex min-h-[400px] items-center justify-center p-10">

                <div className="text-center text-white">

                  <div className="mb-6 text-8xl">
                    🌿
                  </div>

                  <h3 className="text-3xl font-bold">
                    Nature&apos;s Goodness
                  </h3>

                  <p className="mt-3 text-green-100">
                    Quality products for your business
                  </p>

                  <div className="mx-auto mt-8 h-px w-24 bg-[#D4A72C]" />

                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.4em] text-green-100">
                    YETOP STORES
                  </p>

                </div>

              </div>

            </div>

            {/* Floating card */}
            <div className="absolute -bottom-5 left-5 rounded-2xl bg-white px-5 py-4 shadow-xl sm:left-8">

              <p className="text-xs text-gray-500">
                Your trusted
              </p>

              <p className="font-bold text-[#14532D]">
                Wholesale Partner
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section
        id="categories"
        className="bg-white py-20"
      >

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          {/* Heading */}
          <div className="mb-12 text-center">

            <span className="text-sm font-bold uppercase tracking-[0.25em] text-[#22C55E]">
              Explore
            </span>

            <h2 className="mt-3 text-3xl font-bold text-[#14532D] sm:text-4xl">
              Shop by Category
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-gray-600">
              Find the products you need quickly and easily.
            </p>

          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

            {categories.map((category) => (
              <a
                key={category.name}
                href="/products"
                className="group rounded-2xl border border-gray-100 bg-[#FAFAF7] p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:bg-green-50 hover:shadow-lg"
              >

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm transition duration-300 group-hover:scale-105">
                  {category.icon}
                </div>

                <h3 className="mt-4 font-bold text-[#14532D]">
                  {category.name}
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  {category.description}
                </p>

              </a>
            ))}

          </div>

        </div>

      </section>

      {/* ================= PRODUCTS PLACEHOLDER ================= */}
      <section
        id="products"
        className="bg-[#FAFAF7] py-20"
      >

        <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">

          <span className="text-sm font-bold uppercase tracking-[0.25em] text-[#22C55E]">
            Coming Next
          </span>

          <h2 className="mt-3 text-3xl font-bold text-[#14532D] sm:text-4xl">
            Featured Products
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Our product catalogue will appear here. Products, prices and
            availability will eventually be managed directly from the Yetop
            admin dashboard.
          </p>

          <div className="mt-8">
            <a
              href="/products"
              className="inline-flex rounded-full bg-[#14532D] px-7 py-3 font-semibold text-white transition hover:bg-[#0F3D21]"
            >
              Explore Categories
            </a>
          </div>

        </div>

      </section>

      {/* ================= ABOUT ================= */}
      <section
        id="about"
        className="bg-white py-20"
      >

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            <div>

              <span className="text-sm font-bold uppercase tracking-[0.25em] text-[#22C55E]">
                About Yetop
              </span>

              <h2 className="mt-3 text-3xl font-bold text-[#14532D] sm:text-4xl">
                Your trusted wholesale partner.
              </h2>

              <p className="mt-6 leading-8 text-gray-600">
                Yetop Stores supplies quality herbal products and wholesale
                goods to retailers. Our goal is to make ordering simple,
                convenient and reliable.
              </p>

              <p className="mt-4 leading-8 text-gray-600">
                Browse our products, place your order and allow our team to
                confirm availability, pricing and delivery arrangements.
              </p>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="rounded-3xl bg-[#14532D] p-7 text-white">
                <div className="text-4xl">🌿</div>
                <h3 className="mt-5 text-xl font-bold">
                  Quality
                </h3>
                <p className="mt-2 text-sm leading-6 text-green-100">
                  Products you can confidently stock in your business.
                </p>
              </div>

              <div className="rounded-3xl bg-green-50 p-7 text-[#14532D]">
                <div className="text-4xl">📦</div>
                <h3 className="mt-5 text-xl font-bold">
                  Wholesale
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Wholesale products designed for retailers.
                </p>
              </div>

              <div className="rounded-3xl bg-[#FAFAF7] p-7 text-[#14532D]">
                <div className="text-4xl">🛒</div>
                <h3 className="mt-5 text-xl font-bold">
                  Simple Ordering
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Place an order without complicated registration.
                </p>
              </div>

              <div className="rounded-3xl bg-[#D4A72C] p-7 text-white">
                <div className="text-4xl">🤝</div>
                <h3 className="mt-5 text-xl font-bold">
                  Trusted Service
                </h3>
                <p className="mt-2 text-sm leading-6 text-yellow-50">
                  We work with retailers to make supply easier.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-[#14532D] py-20 text-white">

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="text-center">

            <span className="text-sm font-bold uppercase tracking-[0.25em] text-green-300">
              Simple Process
            </span>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              How Ordering Works
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-green-100">
              From selecting your products to delivery, we keep the process
              simple.
            </p>

          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">

            {[
              ["01", "Browse", "Explore our products and categories."],
              ["02", "Order", "Add products and submit your order."],
              ["03", "Approval", "Yetop confirms price and availability."],
              ["04", "Payment", "Make payment and provide payment evidence."],
              ["05", "Delivery", "We fulfil and deliver your order."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6"
              >

                <span className="text-sm font-bold text-green-300">
                  {number}
                </span>

                <h3 className="mt-4 text-xl font-bold">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-green-100">
                  {description}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ================= CONTACT CTA ================= */}
      <section
        id="contact"
        className="bg-[#FAFAF7] py-20"
      >

        <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">

          <div className="rounded-[2rem] bg-white p-8 shadow-xl sm:p-12">

            <div className="text-5xl">
              💬
            </div>

            <h2 className="mt-5 text-3xl font-bold text-[#14532D]">
              Need help with your order?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-gray-600">
              Our team is available to help you with products, orders and
              delivery information.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">

              <a
                href="tel:+2347038204321"
                className="rounded-full bg-[#14532D] px-7 py-3 font-semibold text-white transition hover:bg-[#0F3D21]"
              >
                Call Yetop
              </a>

              <a
        href="https://wa.me/2347038204321"
        target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border-2 border-[#14532D] px-7 py-3 font-semibold text-[#14532D] transition hover:bg-green-50"
      >
  WhatsApp Us
</a>

            </div>

          </div>

        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#0F3D21] py-12 text-white">

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="grid gap-10 md:grid-cols-3">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  🌿
                </div>

                <div>
                  <p className="font-bold tracking-wide">
                    YETOP
                  </p>

                  <p className="-mt-1 text-[9px] tracking-[0.3em] text-green-200">
                    STORES
                  </p>
                </div>

              </div>

              <p className="mt-5 max-w-sm text-sm leading-6 text-green-100">
                Your trusted wholesale partner for quality herbal products
                and goods.
              </p>

            </div>

            <div>

              <h3 className="font-bold">
                Quick Links
              </h3>

              <div className="mt-4 space-y-3 text-sm text-green-100">

                <a
                  href="#categories"
                  className="block hover:text-white"
                >
                  Categories
                </a>

                <a
                  href="#products"
                  className="block hover:text-white"
                >
                  Shop Products
                </a>

                <a
                  href="/track-order"
                  className="block hover:text-white"
                >
                  Track Order
                </a>

                <a
                  href="#about"
                  className="block hover:text-white"
                >
                  About Yetop
                </a>

                <a
                  href="#contact"
                  className="block hover:text-white"
                >
                  Contact
                </a>

              </div>

            </div>

            <div>

              <h3 className="font-bold">
                Customer Support
              </h3>

              <div className="mt-4 space-y-3 text-sm text-green-100">

                <p>
                  📞 Call Yetop Stores
                </p>

                <p>
                  💬 WhatsApp Support
                </p>

                <p>
                  ✉️ Email Support
                </p>

              </div>

            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-green-200">
            © {new Date().getFullYear()} Yetop Stores. All rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}