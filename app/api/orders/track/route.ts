import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const orderNumber =
      searchParams.get("orderNumber")?.trim();

    const phone =
      searchParams.get("phone")?.trim();

    /*
     * Both values are required.
     */
    if (!orderNumber || !phone) {
      return Response.json(
        {
          success: false,
          error:
            "Order number and phone number are required.",
        },
        { status: 400 }
      );
    }

    /*
     * Get orders and find the matching order.
     *
     * We intentionally use the Prisma 8 contract
     * collection API already working in this project.
     */
    const orders =
      await db.orm.public.Order.all();

    const order = orders.find(
      (item) =>
        String(item.orderNumber).toUpperCase() ===
          orderNumber.toUpperCase() &&
        String(item.customerPhone).trim() === phone
    );

    /*
     * Do not reveal whether the order number exists
     * when the phone number does not match.
     */
    if (!order) {
      return Response.json(
        {
          success: false,
          error:
            "We could not find an order with those details.",
        },
        { status: 404 }
      );
    }

    const orderId = String(order.id);

    /*
     * Get order items separately.
     */
    const orderItems =
      await db.orm.public.OrderItem.all();

    const items = orderItems
      .filter(
        (item) =>
          String(item.orderId) === orderId
      )
      .map((item) => ({
        id: String(item.id),

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

    /*
     * Determine the next customer action.
     */
    let nextAction = "WAITING_FOR_APPROVAL";

    if (
      String(order.status) ===
      "AWAITING_PAYMENT"
    ) {
      nextAction = "CONTINUE_TO_PAYMENT";
    }

    if (
      String(order.status) ===
      "FULFILMENT"
    ) {
      nextAction = "FULFILMENT_IN_PROGRESS";
    }

    if (
      String(order.status) ===
      "DELIVERED"
    ) {
      nextAction = "ORDER_COMPLETED";
    }

    if (
      String(order.status) ===
      "CANCELLED"
    ) {
      nextAction = "ORDER_CANCELLED";
    }

    /*
     * Return only information needed by the customer.
     */
    return Response.json({
      success: true,

      order: {
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
                String(order.deliveryFee)
              )
            : null,

        grandTotal:
          order.grandTotal !== null
            ? Number(
                String(order.grandTotal)
              )
            : null,

        deliveryPaymentMethod:
          String(
            order.deliveryPaymentMethod
          ),

        deliveryPreference:
          String(
            order.deliveryPreference
          ),

        deliveryFeePaymentStatus:
          String(
            order.deliveryFeePaymentStatus
          ),

        deliveryNote:
          order.deliveryNote
            ? String(order.deliveryNote)
            : null,

        customer: {
          fullName:
            String(order.customerName),

          phone:
            String(order.customerPhone),

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

        createdAt:
          String(order.createdAt),

        approvedAt:
          order.approvedAt
            ? String(order.approvedAt)
            : null,

        fulfilledAt:
          order.fulfilledAt
            ? String(order.fulfilledAt)
            : null,

        deliveredAt:
          order.deliveredAt
            ? String(order.deliveredAt)
            : null,

        collectedAt:
          order.collectedAt
            ? String(order.collectedAt)
            : null,

        items,

        totalItems:
          items.reduce(
            (total, item) =>
              total + item.quantity,
            0
          ),

        nextAction,
      },
    });
  } catch (error) {
    console.error(
      "Failed to track order:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to track order.",
      },
      { status: 500 }
    );
  }
}