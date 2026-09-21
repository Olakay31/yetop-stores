import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { Temporal } from "@js-temporal/polyfill";
import { randomUUID } from "crypto";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentActionBody = {
  action?: string;
  adminNote?: string;
};

export async function POST(
  request: Request,
  { params }: RouteProps
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

    const { id } = await params;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "Payment ID is required.",
        },
        { status: 400 }
      );
    }

    let body: PaymentActionBody;

    try {
      body = (await request.json()) as PaymentActionBody;
    } catch {
      return Response.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const action = body.action?.trim().toUpperCase();

    if (action !== "VERIFY" && action !== "REJECT") {
      return Response.json(
        {
          success: false,
          error: "Invalid action. Use VERIFY or REJECT.",
        },
        { status: 400 }
      );
    }

    const adminNote =
      typeof body.adminNote === "string"
        ? body.adminNote.trim()
        : "";

    if (action === "REJECT" && !adminNote) {
      return Response.json(
        {
          success: false,
          error: "Please provide a reason for rejecting the payment.",
        },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      /*
       * ============================================================
       * GET PAYMENT
       * ============================================================
       */

      const payments = await tx.orm.public.Payment.all();

      const payment = payments.find(
        (item) => String(item.id) === String(id)
      );

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      if (String(payment.status) !== "PENDING") {
        throw new Error("PAYMENT_ALREADY_PROCESSED");
      }

      /*
       * ============================================================
       * GET ORDER
       * ============================================================
       */

      const orders = await tx.orm.public.Order.all();

      const order = orders.find(
        (item) =>
          String(item.id) === String(payment.orderId)
      );

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const paymentType = String(
        payment.paymentType || "PRODUCT"
      );

      const now = Temporal.Now.instant();

      /*
       * ============================================================
       * PRODUCT PAYMENT
       * ============================================================
       */

      if (paymentType === "PRODUCT") {
        if (
          String(order.status) !== "AWAITING_PAYMENT"
        ) {
          throw new Error(
            "ORDER_NOT_AWAITING_PRODUCT_PAYMENT"
          );
        }

        /*
         * ========================================================
         * REJECT PRODUCT PAYMENT
         * ========================================================
         */

        if (action === "REJECT") {
          const updatedPayment =
            await tx.orm.public.Payment
              .where({
                id: payment.id,
              })
              .update({
                status: "REJECTED",
                adminNote,
                updatedAt: now,
              });

          return {
            action: "REJECT",
            paymentType: "PRODUCT",
            payment: updatedPayment,
            order,
          };
        }

        /*
         * ========================================================
         * VERIFY PRODUCT PAYMENT
         *
         * IMPORTANT:
         * Inventory is deducted here when the order enters
         * FULFILMENT.
         * ========================================================
         */

        const orderItems =
          await tx.orm.public.OrderItem.all();

        const items = orderItems.filter(
          (item) =>
            String(item.orderId) ===
            String(order.id)
        );

        if (items.length === 0) {
          throw new Error(
            "ORDER_HAS_NO_ITEMS"
          );
        }

        const productUnits =
          await tx.orm.public.ProductUnit.all();

        /*
         * --------------------------------------------------------
         * Validate every item's inventory BEFORE changing anything.
         * --------------------------------------------------------
         */

        const inventoryUpdates = [];

        for (const item of items) {
          const productUnit =
            productUnits.find(
              (unit) =>
                String(unit.id) ===
                String(item.productUnitId)
            );

          if (!productUnit) {
            throw new Error(
              "PRODUCT_UNIT_NOT_FOUND"
            );
          }

          const quantity =
            Number(item.quantity);

          const stockQuantity =
            Number(
              productUnit.stockQuantity
            );

          const reservedQty =
            Number(
              productUnit.reservedQty
            );

          if (
            !Number.isInteger(quantity) ||
            quantity <= 0
          ) {
            throw new Error(
              "INVALID_ORDER_QUANTITY"
            );
          }

          /*
           * The quantity should have already been reserved
           * when the order was created.
           *
           * Therefore the reservation must still cover
           * the order at fulfilment time.
           */
          if (reservedQty < quantity) {
            throw new Error(
              "INSUFFICIENT_RESERVED_STOCK"
            );
          }

          if (stockQuantity < quantity) {
            throw new Error(
              "INSUFFICIENT_STOCK"
            );
          }

          inventoryUpdates.push({
            item,
            productUnit,
            quantity,
            newStockQuantity:
              stockQuantity - quantity,
            newReservedQty:
              reservedQty - quantity,
          });
        }

        /*
         * --------------------------------------------------------
         * Deduct inventory and release reservations.
         * --------------------------------------------------------
         */

        for (const inventory of inventoryUpdates) {
          const {
            item,
            productUnit,
            quantity,
            newStockQuantity,
            newReservedQty,
          } = inventory;

          await tx.orm.public.ProductUnit
            .where({
              id: productUnit.id,
            })
            .update({
              stockQuantity:
                newStockQuantity,

              reservedQty:
                newReservedQty,

              updatedAt: now,
            });

          /*
           * Record the physical stock deduction.
           *
           * Negative quantity means stock was removed.
           */
          await tx.orm.public.InventoryTransaction
            .create({
              id: randomUUID(),

              type: "FULFILLMENT",

              quantity: -quantity,

              reason:
                "Stock deducted for order fulfilment.",

              reference:
                order.orderNumber,

              createdAt: now,

              productUnitId:
                item.productUnitId,
            });
        }

        /*
         * --------------------------------------------------------
         * Mark payment as verified.
         * --------------------------------------------------------
         */

        const updatedPayment =
          await tx.orm.public.Payment
            .where({
              id: payment.id,
            })
            .update({
              status: "VERIFIED",

              verifiedAt: now,

              updatedAt: now,

              adminNote:
                adminNote || null,
            });

        /*
         * --------------------------------------------------------
         * Move order to FULFILMENT.
         * --------------------------------------------------------
         */

        const updatedOrder =
          await tx.orm.public.Order
            .where({
              id: order.id,
            })
            .update({
              status: "FULFILMENT",

              fulfilledAt: now,

              updatedAt: now,
            });

        return {
          action: "VERIFY",

          paymentType: "PRODUCT",

          payment: updatedPayment,

          order: updatedOrder,
        };
      }

      /*
       * ============================================================
       * DELIVERY PAYMENT
       * ============================================================
       */

      if (paymentType === "DELIVERY") {
        if (
          String(order.deliveryPreference) !==
          "YETOP_DELIVERY"
        ) {
          throw new Error(
            "DELIVERY_PAYMENT_NOT_REQUIRED"
          );
        }

        if (
          String(
            order.deliveryFeePaymentStatus
          ) !== "AWAITING_PAYMENT"
        ) {
          throw new Error(
            "DELIVERY_PAYMENT_NOT_AWAITING"
          );
        }

        /*
         * ========================================================
         * VERIFY DELIVERY PAYMENT
         * ========================================================
         */

        if (action === "VERIFY") {
          const updatedPayment =
            await tx.orm.public.Payment
              .where({
                id: payment.id,
              })
              .update({
                status: "VERIFIED",

                verifiedAt: now,

                updatedAt: now,

                adminNote:
                  adminNote || null,
              });

          /*
           * IMPORTANT:
           *
           * Delivery payment does NOT affect inventory.
           *
           * Product inventory was already deducted when
           * the product payment moved the order into FULFILMENT.
           *
           * Delivery payment also does NOT change the
           * order status.
           */
          const updatedOrder =
            await tx.orm.public.Order
              .where({
                id: order.id,
              })
              .update({
                deliveryFeePaymentStatus:
                  "PAID",

                updatedAt: now,
              });

          return {
            action: "VERIFY",

            paymentType: "DELIVERY",

            payment: updatedPayment,

            order: updatedOrder,
          };
        }

        /*
         * ========================================================
         * REJECT DELIVERY PAYMENT
         * ========================================================
         */

        const updatedPayment =
          await tx.orm.public.Payment
            .where({
              id: payment.id,
            })
            .update({
              status: "REJECTED",

              adminNote,

              updatedAt: now,
            });

        return {
          action: "REJECT",

          paymentType: "DELIVERY",

          payment: updatedPayment,

          order,
        };
      }

      throw new Error(
        "INVALID_PAYMENT_TYPE"
      );
    });

    /*
     * ============================================================
     * SUCCESS RESPONSE
     * ============================================================
     */

    return Response.json({
      success: true,

      message:
        result.paymentType === "DELIVERY"
          ? result.action === "VERIFY"
            ? "Delivery payment verified successfully."
            : "Delivery payment rejected successfully."
          : result.action === "VERIFY"
            ? "Product payment verified successfully. Inventory has been deducted and the order has moved to Fulfilment."
            : "Product payment rejected successfully.",

      payment: result.payment,

      order: result.order,
    });
  } catch (error) {
    console.error(
      "Admin payment action failed:",
      error
    );

    if (error instanceof Error) {
      switch (error.message) {
        case "PAYMENT_NOT_FOUND":
          return Response.json(
            {
              success: false,
              error:
                "Payment could not be found.",
            },
            { status: 404 }
          );

        case "PAYMENT_ALREADY_PROCESSED":
          return Response.json(
            {
              success: false,
              error:
                "This payment has already been processed.",
            },
            { status: 409 }
          );

        case "ORDER_NOT_FOUND":
          return Response.json(
            {
              success: false,
              error:
                "The order linked to this payment could not be found.",
            },
            { status: 404 }
          );

        case "ORDER_HAS_NO_ITEMS":
          return Response.json(
            {
              success: false,
              error:
                "This order has no items to fulfil.",
            },
            { status: 409 }
          );

        case "PRODUCT_UNIT_NOT_FOUND":
          return Response.json(
            {
              success: false,
              error:
                "One or more products in this order could not be found.",
            },
            { status: 409 }
          );

        case "INVALID_ORDER_QUANTITY":
          return Response.json(
            {
              success: false,
              error:
                "One or more order quantities are invalid.",
            },
            { status: 409 }
          );

        case "INSUFFICIENT_RESERVED_STOCK":
          return Response.json(
            {
              success: false,
              error:
                "The reserved stock is no longer sufficient to fulfil this order.",
            },
            { status: 409 }
          );

        case "INSUFFICIENT_STOCK":
          return Response.json(
            {
              success: false,
              error:
                "There is not enough physical stock to fulfil this order.",
            },
            { status: 409 }
          );

        case "ORDER_NOT_AWAITING_PRODUCT_PAYMENT":
          return Response.json(
            {
              success: false,
              error:
                "This order is no longer awaiting product payment.",
            },
            { status: 409 }
          );

        case "DELIVERY_PAYMENT_NOT_REQUIRED":
          return Response.json(
            {
              success: false,
              error:
                "This order does not require a delivery payment.",
            },
            { status: 409 }
          );

        case "DELIVERY_PAYMENT_NOT_AWAITING":
          return Response.json(
            {
              success: false,
              error:
                "This delivery payment is no longer awaiting verification.",
            },
            { status: 409 }
          );

        case "INVALID_PAYMENT_TYPE":
          return Response.json(
            {
              success: false,
              error:
                "Invalid payment type.",
            },
            { status: 400 }
          );
      }
    }

    return Response.json(
      {
        success: false,
        error:
          "Unable to process the payment action.",
      },
      { status: 500 }
    );
  }
}