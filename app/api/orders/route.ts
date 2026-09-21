import { db } from "@/lib/db";
import { Temporal } from "@js-temporal/polyfill";

type OrderItemInput = {
  id: string;
  quantity: number;
  price: number;
};

type CreateOrderRequest = {
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    deliveryPreference?: "PICKUP" | "YETOP_DELIVERY";
    address?: string;
    city?: string;
    state?: string;
    deliveryNote?: string;
  };
  items: OrderItemInput[];
};

type ValidatedOrderItem = {
  productId: string;
  productUnitId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productName: string;
  unitName: string;
};

function generateOrderNumber() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 5; i++) {
    code += characters.charAt(
      Math.floor(
        Math.random() * characters.length
      )
    );
  }

  return `YET${code}`;
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function extractProductAndUnitIds(
  compositeId: string
) {
  /*
   * Cart IDs are:
   *
   * productId-productUnitId
   *
   * Both values are UUIDs.
   */

  if (compositeId.length !== 73) {
    return null;
  }

  const productId = compositeId.slice(0, 36);
  const separator = compositeId.charAt(36);
  const productUnitId = compositeId.slice(37);

  if (
    separator !== "-" ||
    !isValidUuid(productId) ||
    !isValidUuid(productUnitId)
  ) {
    return null;
  }

  return {
    productId,
    productUnitId,
  };
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as CreateOrderRequest;

    const customer = body.customer;
    const items = body.items;

    if (!customer || !Array.isArray(items)) {
      return Response.json(
        {
          success: false,
          error: "Invalid order request.",
        },
        { status: 400 }
      );
    }

    /*
     * CUSTOMER INFORMATION
     */

    const fullName =
      customer.fullName?.trim();

    const phone =
      customer.phone?.trim();

    const email =
      customer.email?.trim() || null;

    /*
     * FULFILMENT
     *
     * Default to Yetop Delivery if the
     * frontend does not explicitly send
     * a preference.
     */
    const deliveryPreference =
      customer.deliveryPreference ===
      "PICKUP"
        ? "PICKUP"
        : "YETOP_DELIVERY";

    /*
     * Delivery fields are only required
     * when the customer chooses
     * Yetop Delivery.
     */
    const address =
      customer.address?.trim() || "";

    const city =
      customer.city?.trim() || "";

    const state =
      customer.state?.trim() || "";

    const deliveryNote =
      customer.deliveryNote?.trim() || null;

    /*
     * CUSTOMER VALIDATION
     */
    if (!fullName || !phone) {
      return Response.json(
        {
          success: false,
          error:
            "Full name and phone number are required.",
        },
        { status: 400 }
      );
    }

    /*
     * DELIVERY VALIDATION
     *
     * Pickup does NOT require:
     * - address
     * - city
     * - state
     *
     * Yetop Delivery requires all three.
     */
    if (
      deliveryPreference ===
        "YETOP_DELIVERY" &&
      (!address || !city || !state)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Delivery address, city and state are required for Yetop Delivery.",
        },
        { status: 400 }
      );
    }

    /*
     * ORDER VALIDATION
     */
    if (items.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Your order is empty.",
        },
        { status: 400 }
      );
    }

    /*
     * FIRST STOCK / PRODUCT VALIDATION
     *
     * We validate the customer's submitted
     * cart against the current catalogue.
     *
     * The final reservation check happens
     * again inside the transaction.
     */
    const validatedItems: ValidatedOrderItem[] =
      [];

    for (const item of items) {
      if (
        typeof item.id !== "string" ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Invalid product quantity.",
          },
          { status: 400 }
        );
      }

      const ids =
        extractProductAndUnitIds(item.id);

      if (!ids) {
        return Response.json(
          {
            success: false,
            error:
              "One of the products in your cart is invalid. Please return to the catalogue and try again.",
          },
          { status: 400 }
        );
      }

      const product =
        await db.orm.public.Product
          .where({
            id: ids.productId,
          })
          .first();

      const productUnit =
        await db.orm.public.ProductUnit
          .where({
            id: ids.productUnitId,
          })
          .first();

      if (!product || !productUnit) {
        return Response.json(
          {
            success: false,
            error:
              "One of the products in your cart is no longer available. Please refresh the catalogue.",
          },
          { status: 409 }
        );
      }

      const productName =
        String(product.name);

      const productUnitName =
        String(productUnit.unitName);

      const isProductActive =
        Boolean(product.isActive);

      const isUnitActive =
        Boolean(productUnit.isActive);

      const productUnitProductId =
        String(productUnit.productId);

      if (
        !isProductActive ||
        !isUnitActive ||
        productUnitProductId !==
          String(product.id)
      ) {
        return Response.json(
          {
            success: false,
            error:
              `${productName} is currently unavailable. Please refresh the catalogue.`,
          },
          { status: 409 }
        );
      }

      const currentPrice =
        Number(String(productUnit.price));

      const stockQuantity =
        Number(productUnit.stockQuantity);

      const reservedQuantity =
        Number(productUnit.reservedQty);

      const minimumOrderQuantity =
        Number(productUnit.minOrderQty);

      if (
        !Number.isFinite(currentPrice) ||
        !Number.isFinite(stockQuantity) ||
        !Number.isFinite(reservedQuantity) ||
        !Number.isFinite(
          minimumOrderQuantity
        )
      ) {
        throw new Error(
          `Invalid product data for ${productName}.`
        );
      }

      /*
       * PRICE PROTECTION
       *
       * Never silently change the customer's
       * submitted price.
       */
      if (
        !Number.isFinite(item.price) ||
        item.price !== currentPrice
      ) {
        return Response.json(
          {
            success: false,
            code: "PRICE_CHANGED",
            error:
              `The price for ${productName} has changed. Please refresh the catalogue and review your order again.`,
            product: {
              id: String(product.id),
              name: productName,
              oldPrice: item.price,
              currentPrice,
            },
          },
          { status: 409 }
        );
      }

      /*
       * MINIMUM ORDER QUANTITY
       */
      if (
        item.quantity <
        minimumOrderQuantity
      ) {
        return Response.json(
          {
            success: false,
            code: "MINIMUM_ORDER",
            error:
              `${productName} has a minimum order quantity of ${minimumOrderQuantity} ${productUnitName}.`,
          },
          { status: 409 }
        );
      }

      /*
       * AVAILABLE STOCK
       */
      const availableStock =
        stockQuantity -
        reservedQuantity;

      if (
        item.quantity >
        availableStock
      ) {
        return Response.json(
          {
            success: false,
            code: "INSUFFICIENT_STOCK",
            error:
              `Only ${availableStock} ${productUnitName} of ${productName} are currently available.`,
          },
          { status: 409 }
        );
      }

      const lineTotal =
        currentPrice * item.quantity;

      validatedItems.push({
        productId:
          String(product.id),

        productUnitId:
          String(productUnit.id),

        quantity:
          item.quantity,

        unitPrice:
          currentPrice,

        lineTotal,

        productName,

        unitName:
          productUnitName,
      });
    }

    /*
     * PRODUCT TOTAL ONLY
     *
     * Delivery fee is deliberately NOT
     * included here.
     */
    const productsTotal =
      validatedItems.reduce(
        (total, item) =>
          total + item.lineTotal,
        0
      );

    /*
     * RESERVATION EXPIRY
     *
     * Stock is reserved for 10 minutes
     * after the order is created.
     *
     * The reservation will remain protected
     * if the customer submits payment evidence
     * before the expiry is reached.
     */
    const reservationExpiresAt =
      Temporal.Now.instant().add(
        Temporal.Duration.from({
          minutes: 10,
        })
      );

    /*
     * CUSTOMER + STOCK RESERVATION +
     * ORDER + ORDER ITEMS
     *
     * All handled inside ONE transaction.
     */
    const result =
      await db.transaction(
        async (tx) => {
          /*
           * FINAL STOCK PROTECTION
           *
           * Re-read every ProductUnit inside
           * the transaction immediately before
           * reserving stock.
           */
          for (const item of validatedItems) {
            const currentUnit =
              await tx.orm.public.ProductUnit
                .where({
                  id: item.productUnitId,
                })
                .first();

            if (!currentUnit) {
              throw new Error(
                `Product unit ${item.productUnitId} no longer exists.`
              );
            }

            const currentStock =
              Number(
                currentUnit.stockQuantity
              );

            const currentReserved =
              Number(
                currentUnit.reservedQty
              );

            const currentAvailable =
              currentStock -
              currentReserved;

            /*
             * Another retailer may have
             * reserved the stock since the
             * first validation.
             */
            if (
              item.quantity >
              currentAvailable
            ) {
              const error =
                new Error(
                  `Only ${currentAvailable} ${item.unitName} of ${item.productName} are currently available.`
                );

              (
                error as Error & {
                  code?: string;
                }
              ).code =
                "INSUFFICIENT_STOCK";

              throw error;
            }

            /*
             * Reserve the stock.
             */
            await tx.orm.public.ProductUnit
              .where({
                id: item.productUnitId,
              })
              .update({
                reservedQty:
                  currentReserved +
                  item.quantity,
              });
          }

          /*
           * FIND CUSTOMER BY PHONE
           *
           * Phone number is the primary
           * customer identifier.
           */
          const existingCustomer =
            await tx.orm.public.Customer
              .where({
                phone,
              })
              .first();

          let customerRecord;

          if (existingCustomer) {
            customerRecord =
              await tx.orm.public.Customer
                .where({
                  id: existingCustomer.id,
                })
                .update({
                  fullName,
                  email,
                  isActive: true,
                });
          } else {
            customerRecord =
              await tx.orm.public.Customer.create(
                {
                  id:
                    crypto.randomUUID(),

                  fullName,

                  phone,

                  email,

                  isActive: true,
                }
              );
          }

          if (!customerRecord) {
            throw new Error(
              "Unable to create or update customer."
            );
          }

          /*
           * GENERATE ORDER NUMBER
           */
          const orderNumber =
            generateOrderNumber();

          /*
           * CREATE ORDER
           *
           * IMPORTANT:
           *
           * - Product payment only
           * - Delivery fee = null
           * - Grand total = null
           * - Delivery preference saved
           * - Reservation expires after 10 minutes
           */
          const order =
            await tx.orm.public.Order.create(
              {
                id:
                  crypto.randomUUID(),

                orderNumber,

                status:
                  "AWAITING_PAYMENT",

                productsTotal:
                  productsTotal.toFixed(2),

                deliveryFee:
                  null,

                grandTotal:
                  null,

                deliveryPaymentMethod:
                  "PENDING_CONFIRMATION",

                deliveryPreference:
                  deliveryPreference,

                deliveryNote:
                  deliveryNote,

                customerName:
                  fullName,

                customerPhone:
                  phone,

                customerEmail:
                  email,

                /*
                 * For Pickup these remain
                 * empty strings.
                 *
                 * For Yetop Delivery they
                 * contain the customer's
                 * delivery information.
                 */
                deliveryAddress:
                  address,

                deliveryCity:
                  city,

                deliveryState:
                  state,

                cancellationReason:
                  null,

                adminNote:
                  null,

                customerId:
                  customerRecord.id,

                /*
                 * Stock reservation expiry.
                 */
                reservationExpiresAt:
                  reservationExpiresAt,
              }
            );

          /*
           * CREATE ORDER ITEMS
           */
          await tx.orm.public.OrderItem.createAll(
            validatedItems.map(
              (item) => ({
                id:
                  crypto.randomUUID(),

                quantity:
                  item.quantity,

                unitPrice:
                  item.unitPrice.toFixed(2),

                lineTotal:
                  item.lineTotal.toFixed(2),

                productName:
                  item.productName,

                unitName:
                  item.unitName,

                orderId:
                  order.id,

                productId:
                  item.productId,

                productUnitId:
                  item.productUnitId,
              })
            )
          );

          return {
            orderId:
              String(order.id),

            orderNumber:
              String(order.orderNumber),

            status:
              String(order.status),

            reservationExpiresAt:
              order.reservationExpiresAt,
          };
        }
      );

    /*
     * RESPONSE
     */
    return Response.json({
      success: true,

      order: {
        id:
          result.orderId,

        orderNumber:
          result.orderNumber,

        status:
          result.status,

        /*
         * Product amount only.
         */
        productsTotal,

        /*
         * Delivery will be determined
         * separately by Yetop.
         */
        deliveryFee:
          null,

        grandTotal:
          null,

        deliveryPreference:
          deliveryPreference,

        deliveryNote:
          deliveryNote,

        reservationExpiresAt:
          result.reservationExpiresAt
            ? String(
                result.reservationExpiresAt
              )
            : null,

        items:
          validatedItems.map(
            (item) => ({
              productId:
                item.productId,

              productUnitId:
                item.productUnitId,

              name:
                item.productName,

              unit:
                item.unitName,

              quantity:
                item.quantity,

              price:
                item.unitPrice,

              lineTotal:
                item.lineTotal,
            })
          ),
      },
    });
  } catch (error) {
    const typedError =
      error as Error & {
        code?: string;
      };

    console.error(
      "Failed to create order:",
      error
    );

    /*
     * STOCK ERROR
     */
    if (
      typedError.code ===
      "INSUFFICIENT_STOCK"
    ) {
      return Response.json(
        {
          success: false,
          code: "INSUFFICIENT_STOCK",
          error:
            typedError.message ||
            "The requested quantity is no longer available. Please refresh the catalogue and try again.",
        },
        { status: 409 }
      );
    }

    /*
     * GENERIC ERROR
     */
    return Response.json(
      {
        success: false,
        error:
          "We could not submit your order. Please try again.",
      },
      { status: 500 }
    );
  }
}