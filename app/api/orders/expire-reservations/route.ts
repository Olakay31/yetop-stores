import { db } from "@/lib/db";
import { Temporal } from "@js-temporal/polyfill";

type ExpiryResult = {
  orderNumber: string;
  releasedItems: number;
};

function getReservationExpiry(
  value: unknown
): Temporal.Instant | null {
  if (!value) {
    return null;
  }

  try {
    return Temporal.Instant.from(String(value));
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    /*
     * Optional protection for automated calls.
     *
     * If RESERVATION_EXPIRY_SECRET is configured,
     * the caller must provide the same value in:
     *
     * x-reservation-secret
     */
    const configuredSecret =
      process.env.RESERVATION_EXPIRY_SECRET;

    if (configuredSecret) {
      const suppliedSecret =
        request.headers.get("x-reservation-secret");

      if (
        !suppliedSecret ||
        suppliedSecret !== configuredSecret
      ) {
        return Response.json(
          {
            success: false,
            error: "Unauthorized.",
          },
          { status: 401 }
        );
      }
    }

    const now = Temporal.Now.instant();

    /*
     * Get orders currently waiting for
     * product payment.
     */
    const orders =
      await db.orm.public.Order
        .where({
          status: "AWAITING_PAYMENT",
        })
        .all();

    const expiredOrders = orders.filter((order) => {
      const expiresAt =
        getReservationExpiry(
          order.reservationExpiresAt
        );

      if (!expiresAt) {
        return false;
      }

      return (
        expiresAt.epochMilliseconds <=
        now.epochMilliseconds
      );
    });

    const results: ExpiryResult[] = [];

    /*
     * Process each expired order separately.
     */
    for (const candidate of expiredOrders) {
      try {
        const result =
          await db.transaction(
            async (tx) => {
              /*
               * Re-read the order inside
               * the transaction.
               */
              const order =
                await tx.orm.public.Order
                  .where({
                    id: candidate.id,
                  })
                  .first();

              if (!order) {
                return null;
              }

              /*
               * The order may no longer be
               * awaiting payment.
               */
              if (
                String(order.status) !==
                "AWAITING_PAYMENT"
              ) {
                return null;
              }

              const expiresAt =
                getReservationExpiry(
                  order.reservationExpiresAt
                );

              if (!expiresAt) {
                return null;
              }

              /*
               * Check expiry again inside
               * the transaction.
               */
              const currentNow =
                Temporal.Now.instant();

              if (
                expiresAt.epochMilliseconds >
                currentNow.epochMilliseconds
              ) {
                return null;
              }

              /*
               * If product payment evidence
               * has already been submitted,
               * keep the reservation.
               */
              const payments =
                await tx.orm.public.Payment
                  .where({
                    orderId: order.id,
                  })
                  .all();

              const productPaymentSubmitted =
                payments.some((payment) => {
                  const paymentType =
                    String(
                      payment.paymentType ||
                        "PRODUCT"
                    );

                  return (
                    paymentType === "PRODUCT" &&
                    Boolean(payment.submittedAt)
                  );
                });

              if (productPaymentSubmitted) {
                return null;
              }

              /*
               * Get the order items.
               */
              const orderItems =
                await tx.orm.public.OrderItem
                  .where({
                    orderId: order.id,
                  })
                  .all();

              let releasedItems = 0;

              /*
               * Release each reserved quantity.
               */
              for (const item of orderItems) {
                const quantity =
                  Number(item.quantity);

                if (
                  !Number.isInteger(quantity) ||
                  quantity <= 0
                ) {
                  continue;
                }

                const productUnit =
                  await tx.orm.public.ProductUnit
                    .where({
                      id: item.productUnitId,
                    })
                    .first();

                if (!productUnit) {
                  throw new Error(
                    `Product unit ${item.productUnitId} no longer exists.`
                  );
                }

                const currentReserved =
                  Number(
                    productUnit.reservedQty
                  );

                const quantityToRelease =
                  Math.min(
                    quantity,
                    Math.max(
                      0,
                      currentReserved
                    )
                  );

                if (
                  quantityToRelease > 0
                ) {
                  await tx.orm.public.ProductUnit
                    .where({
                      id: item.productUnitId,
                    })
                    .update({
                      reservedQty:
                        currentReserved -
                        quantityToRelease,
                    });

                  await tx.orm.public.InventoryTransaction.create(
                    {
                      id: crypto.randomUUID(),

                      type:
                        "RESERVATION_RELEASE",

                      quantity:
                        quantityToRelease,

                      reason:
                        "Order reservation expired before product payment evidence was submitted.",

                      reference:
                        String(
                          order.orderNumber
                        ),

                      productUnitId:
                        item.productUnitId,
                    }
                  );

                  releasedItems +=
                    quantityToRelease;
                }
              }

              /*
               * Cancel the expired order.
               */
              await tx.orm.public.Order
                .where({
                  id: order.id,
                })
                .update({
                  status: "CANCELLED",

                  cancellationReason:
                    "Order reservation expired before product payment evidence was submitted.",

                  cancelledAt:
                    currentNow,

                  updatedAt:
                    currentNow,
                });

              return {
                orderNumber:
                  String(
                    order.orderNumber
                  ),

                releasedItems,
              };
            }
          );

        if (result) {
          results.push(result);
        }
      } catch (error) {
        /*
         * Log the actual error so we can
         * identify any individual failure.
         */
        console.error(
          `Failed to expire reservation for order ${String(
            candidate.orderNumber
          )}:`,
          error
        );
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      orders: results,
    });
  }    catch (error) {
    console.error(
      "EXPIRE_RESERVATIONS_ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Unable to process expired reservations.",
      },
      { status: 500 }
    );
  }
};
  
