import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-[#14532D]"
            >
              YETOP
            </Link>

            <p className="mt-4 max-w-md leading-7 text-gray-600">
              Your trusted wholesale partner for quality herbal products,
              helping retailers stock their businesses with ease.
            </p>

            <p className="mt-5 text-sm font-medium text-[#D4A72C]">
              Simple Ordering. Greater Business.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-[#1F2937]">
              Quick Links
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/"
                className="text-sm text-gray-600 transition hover:text-[#14532D]"
              >
                Home
              </Link>

              <Link
                href="/products"
                className="text-sm text-gray-600 transition hover:text-[#14532D]"
              >
                Products
              </Link>

              <Link
                href="/#about"
                className="text-sm text-gray-600 transition hover:text-[#14532D]"
              >
                About Us
              </Link>

              <Link
                href="/#contact"
                className="text-sm text-gray-600 transition hover:text-[#14532D]"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Customer */}
          <div>
            <h3 className="font-bold text-[#1F2937]">
              Customer
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/products"
                className="text-sm text-gray-600 transition hover:text-[#14532D]"
              >
                Start Ordering
              </Link>

              <span className="text-sm text-gray-600">
                Wholesale Only
              </span>

              <span className="text-sm text-gray-600">
                Delivery Available
              </span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Yetop Stores. All rights reserved.
          </p>

          <p>
            Quality products. Reliable service.
          </p>
        </div>
      </div>
    </footer>
  );
}