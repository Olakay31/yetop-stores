import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Temporal } from "@js-temporal/polyfill";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OrderActionRequest =
  | {
      action: "CANCEL";
      cancellationReason?: string;
    }
  | {
      action: "UPDATE_DELIVERY_FEE";
      deliveryFee?: number | string;
    }
  | {
      action: "MARK_PICKUP";
    }
  | {
      action: "MARK_DELIVERED";
    };

/*
 * ============================================================
 * GET
 * ============================================================
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
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

    const { id } = await context.params;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const order =
      await db.orm.public.Order
        .where({ id })
        .first();

    if (!order) {
      return Response.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    const orderId = String(order.id);
    const orderNumber = String(order.orderNumber);

    /*
     * Load related records.
     */
    const customer =
      await db.orm.public.Customer
        .where({
          id: order.customerId,
        })
        .first();

    const allOrderItems =
      await db.orm.public.OrderItem.all();

    const allPayments =
      await db.orm.public.Payment.all();

    const allInventoryTransactions =
      await db.orm.public.InventoryTransaction.all();

    const allProductUnits =
      await db.orm.public.ProductUnit.all();

    /*
     * Order items.
     */
    const items =
      allOrderItems
        .filter(
          (item) =>
            String(item.orderId) ===
            orderId
        )
        .map((item) => {
          const productUnit =
            allProductUnits.find(
              (unit) =>
                String(unit.id) ===
                String(
                  item.productUnitId
                )
            );

          const quantity =
            Number(item.quantity);

          return {
            id: String(item.id),

            productId:
              String(item.productId),

            productUnitId:
              String(
                item.productUnitId
              ),

            productName:
              String(item.productName),

            unitName:
              String(item.unitName),

            quantity,

            unitPrice:
              Number(
                String(
                  item.unitPrice
                )
              ),

            lineTotal:
              Number(
                String(
                  item.lineTotal
                )
              ),

            inventory:
              productUnit
                ? {
                    stockQuantity:
                      Number(
                        productUnit.stockQuantity
                      ),

                    reservedQty:
                      Number(
                        productUnit.reservedQty
                      ),

                    availableQuantity:
                      Number(
                        productUnit.stockQuantity
                      ) -
                      Number(
                        productUnit.reservedQty
                      ),

                    orderReservedQuantity:
                      quantity,
                  }
                : null,
          };
        });

    /*
     * Payments belonging to this order.
     */
    const payments =
      await Promise.all(
        allPayments
          .filter(
            (payment) =>
              String(
                payment.orderId
              ) === orderId
          )
          .map(async (payment) => {
            let evidenceUrl:
              | string
              | null = null;

            if (payment.evidenceUrl) {
              const evidencePath =
                String(
                  payment.evidenceUrl
                );

              const {
                data:
                  signedUrlData,
                error:
                  signedUrlError,
              } =
                await supabaseAdmin.storage
                  .from(
                    "payment-evidence"
                  )
                  .createSignedUrl(
                    evidencePath,
                    60 * 60
                  );

              if (signedUrlError) {
                console.error(
                  "Failed to create payment evidence signed URL:",
                  signedUrlError
                );
              } else {
                evidenceUrl =
                  signedUrlData
                    ?.signedUrl ??
                  null;
              }
            }

            return {
              id:
                String(payment.id),

              status:
                String(
                  payment.status
                ),

              paymentType:
                payment.paymentType
                  ? String(
                      payment.paymentType
                    )
                  : "PRODUCT",

              amount:
                Number(
                  String(
                    payment.amount
                  )
                ),

              paymentReference:
                payment.paymentReference
                  ? String(
                      payment.paymentReference
                    )
                  : null,

              evidenceUrl,

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
            };
          })
      );

    /*
     * Inventory history belonging to this order.
     */
    const inventoryHistory =
      allInventoryTransactions
        .filter((transaction) => {
          const reference =
            transaction.reference
              ? String(
                  transaction.reference
                )
              : "";

          return (
            reference === orderNumber
          );
        })
        .map((transaction) => ({
          id:
            String(
              transaction.id
            ),

          type:
            String(
              transaction.type
            ),

          quantity:
            Number(
              transaction.quantity
            ),

          reason:
            transaction.reason
              ? String(
                  transaction.reason
                )
              : null,

          reference:
            transaction.reference
              ? String(
                  transaction.reference
                )
              : null,

          createdAt:
            String(
              transaction.createdAt
            ),
        }));

    return Response.json({
      success: true,

      order: {
        id: orderId,

        orderNumber,

        status:
          String(order.status),

        productsTotal:
          Number(
            String(
              order.productsTotal
            )
          ),

        deliveryFee:
          order.deliveryFee !==
          null
            ? Number(
                String(
                  order.deliveryFee
                )
              )
            : null,

        grandTotal:
          order.grandTotal !==
          null
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

        deliveryPaymentStatus:
          String(
            order.deliveryFeePaymentStatus
          ),

        customer: {
          id: customer
            ? String(customer.id)
            : String(
                order.customerId
              ),

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
          preference:
            String(
              order.deliveryPreference
            ),

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

          note:
            order.deliveryNote
              ? String(
                  order.deliveryNote
                )
              : null,
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
            ? String(
                order.approvedAt
              )
            : null,

        cancelledAt:
          order.cancelledAt
            ? String(
                order.cancelledAt
              )
            : null,

        fulfilledAt:
          order.fulfilledAt
            ? String(
                order.fulfilledAt
              )
            : null,

        /*
         * Existing database field.
         *
         * UI terminology will be PICKUP.
         */
        pickupAt:
          order.collectedAt
            ? String(
                order.collectedAt
              )
            : null,

        deliveredAt:
          order.deliveredAt
            ? String(
                order.deliveredAt
              )
            : null,

        items,

        payments,

        inventoryHistory,

        totalItems:
          items.reduce(
            (total, item) =>
              total + item.quantity,
            0
          ),
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch admin order:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load order.",
      },
      { status: 500 }
    );
  }
}

/*
 * ============================================================
 * POST
 *
 * Supported actions:
 *
 * CANCEL
 * UPDATE_DELIVERY_FEE
 * MARK_PICKUP
 * MARK_DELIVERED
 * ============================================================
 */
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
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

    const { id } = await context.params;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as OrderActionRequest;

    /*
     * =====================================================
     * MARK PICKUP
     * =====================================================
     *
     * FULFILMENT
     *      ↓
     * PICKUP
     *
     * Only pickup orders can use this action.
     */
    if (
      body.action ===
      "MARK_PICKUP"
    ) {
      const result =
        await db.transaction(
          async (tx) => {
            const order =
              await tx.orm.public.Order
                .where({ id })
                .first();

            if (!order) {
              const error =
                new Error(
                  "ORDER_NOT_FOUND"
                );

              throw error;
            }

            const status =
              String(order.status);

            const deliveryPreference =
              String(
                order.deliveryPreference
              );

            if (
              status !==
              "FULFILMENT"
            ) {
              const error =
                new Error(
                  "INVALID_FULFILMENT_STATUS"
                );

              throw error;
            }

            if (
              deliveryPreference !==
              "PICKUP"
            ) {
              const error =
                new Error(
                  "PICKUP_NOT_ALLOWED"
                );

              throw error;
            }

            /*
             * Use the existing collectedAt
             * database field, but expose
             * the business terminology as
             * PICKUP.
             */
            const pickupAt =
              Temporal.Now.instant();

            const updatedOrder =
              await tx.orm.public.Order
                .where({ id })
                .update({
                  status:
                    "PICKUP",

                  collectedAt:
                    pickupAt,

                  updatedAt:
                    pickupAt,
                });

            if (!updatedOrder) {
              throw new Error(
                "UPDATE_FAILED"
              );
            }

            return updatedOrder;
          }
        );

      return Response.json({
        success: true,

        message:
          "Order marked as Pickup successfully.",

        order: {
          id:
            String(
              result.id
            ),

          orderNumber:
            String(
              result.orderNumber
            ),

          status:
            String(
              result.status
            ),

          pickupAt:
            result.collectedAt
              ? String(
                  result.collectedAt
                )
              : null,
        },
      });
    }

    /*
     * =====================================================
     * MARK DELIVERED
     * =====================================================
     *
     * FULFILMENT
     *      ↓
     * DELIVERED
     *
     * Only Yetop Delivery orders
     * can use this action.
     */
    if (
      body.action ===
      "MARK_DELIVERED"
    ) {
      const result =
        await db.transaction(
          async (tx) => {
            const order =
              await tx.orm.public.Order
                .where({ id })
                .first();

            if (!order) {
              throw new Error(
                "ORDER_NOT_FOUND"
              );
            }

            const status =
              String(order.status);

            const deliveryPreference =
              String(
                order.deliveryPreference
              );

            if (
              status !==
              "FULFILMENT"
            ) {
              throw new Error(
                "INVALID_FULFILMENT_STATUS"
              );
            }

            if (
              deliveryPreference !==
              "YETOP_DELIVERY"
            ) {
              throw new Error(
                "DELIVERY_NOT_ALLOWED"
              );
            }

            /*
             * If there is a delivery fee,
             * it must be paid before the
             * order can be marked delivered.
             *
             * A zero-fee delivery does not
             * require payment.
             */
            const deliveryFee =
              order.deliveryFee !==
              null
                ? Number(
                    String(
                      order.deliveryFee
                    )
                  )
                : 0;

            const deliveryPaymentStatus =
              String(
                order.deliveryFeePaymentStatus
              );

            if (
              deliveryFee > 0 &&
              deliveryPaymentStatus !==
                "PAID"
            ) {
              throw new Error(
                "DELIVERY_PAYMENT_NOT_COMPLETED"
              );
            }

            const deliveredAt =
              Temporal.Now.instant();

            const updatedOrder =
              await tx.orm.public.Order
                .where({ id })
                .update({
                  status:
                    "DELIVERED",

                  deliveredAt,

                  updatedAt:
                    deliveredAt,
                });

            if (!updatedOrder) {
              throw new Error(
                "UPDATE_FAILED"
              );
            }

            return updatedOrder;
          }
        );

      return Response.json({
        success: true,

        message:
          "Order marked as Delivered successfully.",

        order: {
          id:
            String(
              result.id
            ),

          orderNumber:
            String(
              result.orderNumber
            ),

          status:
            String(
              result.status
            ),

          deliveredAt:
            result.deliveredAt
              ? String(
                  result.deliveredAt
                )
              : null,
        },
      });
    }

    /*
     * =====================================================
     * UPDATE DELIVERY FEE
     * =====================================================
     */
    if (
      body.action ===
      "UPDATE_DELIVERY_FEE"
    ) {
      const order =
        await db.orm.public.Order
          .where({ id })
          .first();

      if (!order) {
        return Response.json(
          {
            success: false,
            error: "Order not found.",
          },
          { status: 404 }
        );
      }

      const deliveryPreference =
        String(
          order.deliveryPreference
        );

      /*
       * Pickup never has a delivery fee.
       */
      if (
        deliveryPreference ===
        "PICKUP"
      ) {
        const updatedOrder =
          await db.orm.public.Order
            .where({ id })
            .update({
              deliveryFee:
                "0.00",

              grandTotal:
                Number(
                  String(
                    order.productsTotal
                  )
                ).toFixed(2),

              deliveryFeePaymentStatus:
                "NOT_REQUIRED",
            });

        if (!updatedOrder) {
          return Response.json(
            {
              success: false,
              error:
                "Unable to update pickup order.",
            },
            { status: 500 }
          );
        }

        return Response.json({
          success: true,

          message:
            "Pickup order updated successfully.",

          deliveryFee: 0,

          grandTotal:
            Number(
              String(
                order.productsTotal
              )
            ),
        });
      }

      /*
       * Yetop Delivery.
       */
      const rawFee =
        body.deliveryFee;

      const deliveryFee =
        Number(rawFee);

      if (
        rawFee === undefined ||
        rawFee === null ||
        rawFee === "" ||
        !Number.isFinite(
          deliveryFee
        ) ||
        deliveryFee < 0
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Please enter a valid delivery fee.",
          },
          { status: 400 }
        );
      }

      /*
       * Prevent changing a delivery fee
       * after delivery payment is already paid.
       */
      if (
        String(
          order.deliveryFeePaymentStatus
        ) === "PAID"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "The delivery fee cannot be changed because the delivery payment has already been paid.",
          },
          { status: 409 }
        );
      }

      const productsTotal =
        Number(
          String(
            order.productsTotal
          )
        );

      const grandTotal =
        productsTotal +
        deliveryFee;

      /*
       * Zero delivery fee does not
       * require a payment.
       */
      const deliveryPaymentStatus =
        deliveryFee === 0
          ? "NOT_REQUIRED"
          : "AWAITING_PAYMENT";

      const updatedOrder =
        await db.orm.public.Order
          .where({ id })
          .update({
            deliveryFee:
              deliveryFee.toFixed(2),

            grandTotal:
              grandTotal.toFixed(2),

            deliveryFeePaymentStatus:
              deliveryPaymentStatus,
          });

      if (!updatedOrder) {
        return Response.json(
          {
            success: false,
            error:
              "Unable to update delivery fee.",
          },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,

        message:
          "Delivery fee updated successfully.",

        deliveryFee,

        grandTotal,
      });
    }

    /*
     * =====================================================
     * CANCEL ORDER
     * =====================================================
     */
    if (body.action !== "CANCEL") {
      return Response.json(
        {
          success: false,
          error:
            "Invalid order action.",
        },
        { status: 400 }
      );
    }

    const order =
      await db.orm.public.Order
        .where({ id })
        .first();

    if (!order) {
      return Response.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    const currentStatus =
      String(order.status);

    /*
     * Cancellation is allowed for
     * awaiting payment and legacy
     * pending approval orders.
     */
    if (
      currentStatus !==
        "AWAITING_PAYMENT" &&
      currentStatus !==
        "PENDING_APPROVAL"
    ) {
      return Response.json(
        {
          success: false,
          code: "INVALID_STATUS",
          error:
            `This order cannot be cancelled because its current status is ${currentStatus}.`,
        },
        { status: 409 }
      );
    }

    const cancellationReason =
      body.cancellationReason?.trim();

    if (!cancellationReason) {
      return Response.json(
        {
          success: false,
          error:
            "A cancellation reason is required.",
        },
        { status: 400 }
      );
    }

    const result =
      await db.transaction(
        async (tx) => {
          /*
           * Re-read the order inside
           * the transaction.
           */
          const currentOrder =
            await tx.orm.public.Order
              .where({ id })
              .first();

          if (!currentOrder) {
            const error =
              new Error(
                "Order not found."
              );

            (
              error as Error & {
                code?: string;
              }
            ).code =
              "ORDER_NOT_FOUND";

            throw error;
          }

          const status =
            String(
              currentOrder.status
            );

          if (
            status !==
              "AWAITING_PAYMENT" &&
            status !==
              "PENDING_APPROVAL"
          ) {
            const error =
              new Error(
                "This order has already been updated."
              );

            (
              error as Error & {
                code?: string;
              }
            ).code =
              "INVALID_STATUS";

            throw error;
          }

          const allOrderItems =
            await tx.orm.public.OrderItem.all();

          const orderItems =
            allOrderItems.filter(
              (item) =>
                String(
                  item.orderId
                ) === id
            );

          /*
           * Release reserved quantity.
           */
          for (const item of orderItems) {
            const productUnit =
              await tx.orm.public.ProductUnit
                .where({
                  id: item.productUnitId,
                })
                .first();

            if (!productUnit) {
              throw new Error(
                `Product unit ${String(
                  item.productUnitId
                )} could not be found.`
              );
            }

            const currentReserved =
              Number(
                productUnit.reservedQty
              );

            const quantity =
              Number(item.quantity);

            if (quantity <= 0) {
              continue;
            }

            const newReserved =
              Math.max(
                0,
                currentReserved -
                  quantity
              );

            await tx.orm.public.ProductUnit
              .where({
                id: productUnit.id,
              })
              .update({
                reservedQty:
                  newReserved,
              });

            await tx.orm.public.InventoryTransaction
              .create({
                id:
                  crypto.randomUUID(),

                type:
                  "RESERVATION_RELEASE",

                quantity,

                reason:
                  "Order cancelled",

                reference:
                  String(
                    currentOrder.orderNumber
                  ),

                productUnitId:
                  productUnit.id,
              });
          }

          const updatedOrder =
            await tx.orm.public.Order
              .where({ id })
              .update({
                status:
                  "CANCELLED",

                cancellationReason,

                cancelledAt:
                  Temporal.Now.instant(),
              });

          if (!updatedOrder) {
            throw new Error(
              "Unable to cancel order."
            );
          }

          const releasedQuantity =
            orderItems.reduce(
              (total, item) =>
                total +
                Number(item.quantity),
              0
            );

          return {
            order:
              updatedOrder,

            releasedQuantity,
          };
        }
      );

    return Response.json({
      success: true,

      message:
        "Order cancelled and inventory reservation released.",

      order: {
        id:
          String(
            result.order.id
          ),

        orderNumber:
          String(
            result.order.orderNumber
          ),

        status:
          String(
            result.order.status
          ),

        cancellationReason:
          result.order
            .cancellationReason
            ? String(
                result.order
                  .cancellationReason
              )
            : null,
      },

      releasedQuantity:
        result.releasedQuantity,
    });
  } catch (error) {
    const typedError =
      error as Error & {
        code?: string;
      };

    console.error(
      "Failed to process admin order action:",
      error
    );

    if (
      error instanceof Error
    ) {
      switch (error.message) {
        case "ORDER_NOT_FOUND":
          return Response.json(
            {
              success: false,
              error:
                "Order not found.",
            },
            { status: 404 }
          );

        case "INVALID_FULFILMENT_STATUS":
          return Response.json(
            {
              success: false,
              code:
                "INVALID_FULFILMENT_STATUS",
              error:
                "This order must be in Fulfilment before it can be marked as Pickup or Delivered.",
            },
            { status: 409 }
          );

        case "PICKUP_NOT_ALLOWED":
          return Response.json(
            {
              success: false,
              code:
                "PICKUP_NOT_ALLOWED",
              error:
                "Only Pickup orders can be marked as Pickup.",
            },
            { status: 409 }
          );

        case "DELIVERY_NOT_ALLOWED":
          return Response.json(
            {
              success: false,
              code:
                "DELIVERY_NOT_ALLOWED",
              error:
                "Only Yetop Delivery orders can be marked as Delivered.",
            },
            { status: 409 }
          );

        case "DELIVERY_PAYMENT_NOT_COMPLETED":
          return Response.json(
            {
              success: false,
              code:
                "DELIVERY_PAYMENT_NOT_COMPLETED",
              error:
                "The delivery fee must be paid before this order can be marked as Delivered.",
            },
            { status: 409 }
          );

        case "UPDATE_FAILED":
          return Response.json(
            {
              success: false,
              error:
                "Unable to update the order.",
            },
            { status: 500 }
          );
      }
    }

    if (
      typedError.code ===
      "INVALID_STATUS"
    ) {
      return Response.json(
        {
          success: false,
          code: "INVALID_STATUS",
          error:
            typedError.message ||
            "The order status has changed. Please refresh and try again.",
        },
        { status: 409 }
      );
    }

    if (
      typedError.code ===
      "ORDER_NOT_FOUND"
    ) {
      return Response.json(
        {
          success: false,
          error: "Order not found.",
        },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          "Unable to update the order. Please try again.",
      },
      { status: 500 }
    );
  }
}