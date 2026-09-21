import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const [
      payments,
      orders,
      customers,
      paymentAccounts,
    ] = await Promise.all([
      db.orm.public.Payment.all(),
      db.orm.public.Order.all(),
      db.orm.public.Customer.all(),
      db.orm.public.PaymentAccount.all(),
    ]);

    const sortedPayments = [...payments].sort((a, b) => {
      const aTime = new Date(String(a.createdAt)).getTime();
      const bTime = new Date(String(b.createdAt)).getTime();

      return bTime - aTime;
    });

    const formattedPayments = await Promise.all(
      sortedPayments.map(async (payment) => {
        const order = orders.find(
          (item) =>
            String(item.id) === String(payment.orderId)
        );

        const customer = order
          ? customers.find(
              (item) =>
                String(item.id) ===
                String(order.customerId)
            )
          : null;

        const paymentAccount = payment.paymentAccountId
          ? paymentAccounts.find(
              (item) =>
                String(item.id) ===
                String(payment.paymentAccountId)
            )
          : null;

        let evidenceUrl: string | null = null;

        if (payment.evidenceUrl) {
          try {
            const { data, error } =
              await supabaseAdmin.storage
                .from("payment-evidence")
                .createSignedUrl(
                    String(payment.evidenceUrl),
                    60 * 60
                  );

            if (!error && data?.signedUrl) {
              evidenceUrl = data.signedUrl;
            } else {
              console.error(
                "Failed to create payment evidence URL:",
                error
              );
            }
          } catch (error) {
            console.error(
              "Payment evidence URL error:",
              error
            );
          }
        }

        return {
          id: payment.id,
          status: payment.status,
          amount: String(payment.amount),
          paymentReference:
            payment.paymentReference ?? null,
          evidenceUrl,
          evidencePath:
            payment.evidenceUrl ?? null,
          adminNote: payment.adminNote ?? null,
          submittedAt: payment.submittedAt
            ? String(payment.submittedAt)
            : null,
          verifiedAt: payment.verifiedAt
            ? String(payment.verifiedAt)
            : null,
          createdAt: String(payment.createdAt),
          updatedAt: String(payment.updatedAt),

          order: order
            ? {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                productsTotal: String(
                  order.productsTotal
                ),
                deliveryFee: order.deliveryFee
                  ? String(order.deliveryFee)
                  : null,
                grandTotal: order.grandTotal
                  ? String(order.grandTotal)
                  : null,
                customerName:
                  order.customerName,
                customerPhone:
                  order.customerPhone,
                customerEmail:
                  order.customerEmail ?? null,
                deliveryAddress:
                  order.deliveryAddress,
                deliveryCity:
                  order.deliveryCity,
                deliveryState:
                  order.deliveryState,
              }
            : null,

          customer: customer
            ? {
                id: customer.id,
                fullName: customer.fullName,
                phone: customer.phone,
                email: customer.email ?? null,
              }
            : null,

          paymentAccount: paymentAccount
            ? {
                id: paymentAccount.id,
                bankName:
                  paymentAccount.bankName,
                accountName:
                  paymentAccount.accountName,
                accountNumber:
                  paymentAccount.accountNumber,
                instructions:
                  paymentAccount.instructions ??
                  null,
              }
            : null,

          /*
           * These are the payment-account values
           * captured at the time the customer paid.
           *
           * They remain useful even if the admin later
           * changes or deactivates the payment account.
           */
          paidTo: {
            bankName:
              payment.paidToBankName ??
              paymentAccount?.bankName ??
              null,
            accountName:
              payment.paidToAccountName ??
              paymentAccount?.accountName ??
              null,
            accountNumber:
              payment.paidToAccountNumber ??
              paymentAccount?.accountNumber ??
              null,
          },
        };
      })
    );

    const summary = {
      totalPayments: formattedPayments.length,

      pending: formattedPayments.filter(
        (payment) => payment.status === "PENDING"
      ).length,

      verified: formattedPayments.filter(
        (payment) => payment.status === "VERIFIED"
      ).length,

      rejected: formattedPayments.filter(
        (payment) => payment.status === "REJECTED"
      ).length,
    };

    return Response.json({
      success: true,
      summary,
      payments: formattedPayments,
    });
  } catch (error) {
    console.error(
      "Failed to load admin payments:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Failed to load payments.",
      },
      {
        status: 500,
      }
    );
  }
}