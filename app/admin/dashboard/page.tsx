import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

import LogoutButton from "../components/LogoutButton";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  /*
   * Get live order information for the dashboard.
   *
   * We use the Prisma 8 contract collection API
   * already working in this project.
   */
  const orders = await db.orm.public.Order.all();

  const pendingApproval = orders.filter(
    (order) =>
      String(order.status) === "PENDING_APPROVAL"
  ).length;

  const awaitingPayment = orders.filter(
    (order) =>
      String(order.status) === "AWAITING_PAYMENT"
  ).length;

  const fulfilment = orders.filter(
    (order) =>
      String(order.status) === "FULFILMENT"
  ).length;

  const delivered = orders.filter(
    (order) =>
      String(order.status) === "DELIVERED"
  ).length;

  const dashboardCards = [
    {
      label: "Pending Approval",
      value: pendingApproval,
      icon: "🕐",
    },
    {
      label: "Awaiting Payment",
      value: awaitingPayment,
      icon: "💳",
    },
    {
      label: "Fulfilment",
      value: fulfilment,
      icon: "📦",
    },
    {
      label: "Delivered",
      value: delivered,
      icon: "🚚",
    },
  ];

  const dashboardSections = [
    {
      title: "Orders",
      description:
        "Review, approve and manage retailer orders.",
      icon: "🛒",
      href: "/admin/orders",
      action: "View Orders",
    },
    {
      title: "Products",
      description:
        "Manage products, pricing, units and stock.",
      icon: "🌿",
      href: "#",
      action: "Coming Soon",
    },
    {
      title: "Customers",
      description:
        "View retailers and their order history.",
      icon: "👥",
      href: "#",
      action: "Coming Soon",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAF7]">
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

          <div className="flex items-center gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {session.fullName}
              </p>

              <p className="text-xs text-gray-500">
                {session.email}
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4A72C]">
            Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold text-[#1F2937]">
            Welcome back,{" "}
            {session.fullName.split(" ")[0]}.
          </h1>

          <p className="mt-3 text-gray-500">
            Here is your Yetop Stores operations workspace.
          </p>
        </div>

        {/* Live order summary */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">
                  {card.icon}
                </span>

                <span className="text-3xl font-bold text-[#14532D]">
                  {card.value}
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-gray-600">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Admin sections */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {dashboardSections.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm"
            >
              <div className="text-3xl">
                {item.icon}
              </div>

              <h2 className="mt-5 text-xl font-bold text-[#1F2937]">
                {item.title}
              </h2>

              <p className="mt-2 leading-6 text-gray-500">
                {item.description}
              </p>

              {item.href === "/admin/orders" ? (
                <a
                  href={item.href}
                  className="mt-6 inline-flex rounded-full bg-[#14532D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4224]"
                >
                  {item.action}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-[#14532D]"
                >
                  {item.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}