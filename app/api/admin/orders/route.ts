import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export async function GET() {
  try {
    /*
     * Protect the endpoint.
     */
    const session = await getAdminSession();

    if (!session) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /*
     * Get the related records separately.
     *
     * We are intentionally using the Prisma 8 contract
     * collection API that is already working in this project.
     */
    const orders =
      await db.orm.public.Order.all();

    const customers =
      await db.orm.public.Customer.all();

    const orderItems =
      await db.orm.public.OrderItem.all();

    const payments =
      await db.orm.public.Payment.all();

    /*
     * Build the admin order view.
     */
    const adminOrders = orders
      .map((order) => {
        const orderId =
          String(order.id);

        const customer =
          customers.find(
            (item) =>
              String(item.id) ===
              String(order.customerId)
          );

        const items =
          orderItems
            .filter(
              (item) =>
                String(item.orderId) ===
                orderId
            )
            .map((item) => ({
              id: String(item.id),
              productId:
                String(item.productId),
              productUnitId:
                String(item.productUnitId),
              productName:
                String(item.productName),
              unitName:
                String(item.unitName),
              quantity:
                Number(item.quantity),
              unitPrice:
                Number(
                  String(item.unitPrice)
                ),
              lineTotal:
                Number(
                  String(item.lineTotal)
                ),
            }));

        const orderPayments =
          payments
            .filter(
              (payment) =>
                String(payment.orderId) ===
                orderId
            )
            .map((payment) => ({
              id: String(payment.id),
              status:
                String(payment.status),
              amount:
                Number(
                  String(payment.amount)
                ),
              paymentReference:
                payment.paymentReference
                  ? String(
                      payment.paymentReference
                    )
                  : null,
              evidenceUrl:
                payment.evidenceUrl
                  ? String(
                      payment.evidenceUrl
                    )
                  : null,
              adminNote:
                payment.adminNote
                  ? String(
                      payment.adminNote
                    )
                  : null,
              submittedAt:
                payment.submittedAt
                  ? String(
                      payment.submittedAt
                    )
                  : null,
              verifiedAt:
                payment.verifiedAt
                  ? String(
                      payment.verifiedAt
                    )
                  : null,
            }));

        return {
          id: orderId,

          orderNumber:
            String(order.orderNumber),

          status:
            String(order.status),

          productsTotal:
            Number(
              String(order.productsTotal)
            ),

          deliveryFee:
            order.deliveryFee !== null
              ? Number(
                  String(
                    order.deliveryFee
                  )
                )
              : null,

          grandTotal:
            order.grandTotal !== null
              ? Number(
                  String(
                    order.grandTotal
                  )
                )
              : null,

          deliveryPaymentMethod:
            String(
              order.deliveryPaymentMethod
            ),

          customer: {
            id: customer
              ? String(customer.id)
              : String(order.customerId),

            fullName:
              String(
                order.customerName
              ),

            phone:
              String(
                order.customerPhone
              ),

            email:
              order.customerEmail
                ? String(
                    order.customerEmail
                  )
                : null,
          },

          delivery: {
            address:
              String(
                order.deliveryAddress
              ),

            city:
              String(
                order.deliveryCity
              ),

            state:
              String(
                order.deliveryState
              ),
          },

          cancellationReason:
            order.cancellationReason
              ? String(
                  order.cancellationReason
                )
              : null,

          adminNote:
            order.adminNote
              ? String(
                  order.adminNote
                )
              : null,

          createdAt:
            String(order.createdAt),

          updatedAt:
            String(order.updatedAt),

          approvedAt:
            order.approvedAt
              ? String(order.approvedAt)
              : null,

          cancelledAt:
            order.cancelledAt
              ? String(order.cancelledAt)
              : null,

          fulfilledAt:
            order.fulfilledAt
              ? String(order.fulfilledAt)
              : null,

          deliveredAt:
            order.deliveredAt
              ? String(order.deliveredAt)
              : null,

          items,

          payments:
            orderPayments,

          totalItems:
            items.reduce(
              (total, item) =>
                total + item.quantity,
              0
            ),
        };
      })
      /*
       * Newest orders first.
       */
      .sort(
        (a, b) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      );

    /*
     * Summary information for the admin UI.
     */
    const summary = {
      totalOrders:
        adminOrders.length,

      pendingApproval:
        adminOrders.filter(
          (order) =>
            order.status ===
            "PENDING_APPROVAL"
        ).length,

      awaitingPayment:
        adminOrders.filter(
          (order) =>
            order.status ===
            "AWAITING_PAYMENT"
        ).length,

      fulfilment:
        adminOrders.filter(
          (order) =>
            order.status ===
            "FULFILMENT"
        ).length,

      delivered:
        adminOrders.filter(
          (order) =>
            order.status ===
            "DELIVERED"
        ).length,

      cancelled:
        adminOrders.filter(
          (order) =>
            order.status ===
            "CANCELLED"
        ).length,

      totalCustomers:
        customers.length,
    };

    return Response.json({
      success: true,
      summary,
      orders: adminOrders,
    });
  } catch (error) {
    console.error(
      "Failed to fetch admin orders:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load orders.",
      },
      { status: 500 }
    );
  }
}