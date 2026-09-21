import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Temporal } from "@js-temporal/polyfill";

type PaymentType =
  | "PRODUCT"
  | "DELIVERY";

function normalizePaymentType(
  value: FormDataEntryValue | null
): PaymentType {
  return value === "DELIVERY"
    ? "DELIVERY"
    : "PRODUCT";
}

/*
 * GET PAYMENT DETAILS
 *
 * PRODUCT:
 * /api/orders/payment?order=YET123&phone=080...
 *
 * DELIVERY:
 * /api/orders/payment?order=YET123&phone=080...&type=DELIVERY
 */
export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

      const orderNumber =
      (
        searchParams.get("orderNumber") ||
        searchParams.get("order")
      )?.trim();
    
    const phone =
      searchParams
        .get("phone")
        ?.trim();
    const requestedType =
      searchParams
        .get("type")
        ?.trim()
        .toUpperCase();

    const paymentType: PaymentType =
      requestedType === "DELIVERY"
        ? "DELIVERY"
        : "PRODUCT";

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

    const orders =
      await db.orm.public.Order.all();

    const order = orders.find(
      (item) =>
        String(item.orderNumber)
          .toUpperCase() ===
          orderNumber.toUpperCase() &&
        String(item.customerPhone) ===
          phone
    );

    if (!order) {
      return Response.json(
        {
          success: false,
          error:
            "Order not found. Please check your order number and phone number.",
        },
        { status: 404 }
      );
    }

    const orderStatus =
      String(order.status);

    /*
     * PRODUCT PAYMENT
     */
    if (paymentType === "PRODUCT") {
      if (
        orderStatus !==
        "AWAITING_PAYMENT"
      ) {
        return Response.json(
          {
            success: false,
            error:
              orderStatus ===
              "PENDING_APPROVAL"
                ? "Your order is still awaiting Yetop approval."
                : orderStatus ===
                    "CANCELLED"
                  ? "This order has been cancelled and cannot be paid for."
                  : "This order is not currently awaiting product payment.",
          },
          { status: 409 }
        );
      }
    }

    /*
     * DELIVERY PAYMENT
     */
    if (paymentType === "DELIVERY") {
      if (
        orderStatus !==
        "FULFILMENT"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Delivery payment becomes available after your product payment has been verified.",
          },
          { status: 409 }
        );
      }

      if (
        String(
          order.deliveryPreference
        ) !== "YETOP_DELIVERY"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "This order does not require a Yetop delivery payment.",
          },
          { status: 409 }
        );
      }

      if (
        order.deliveryFee ===
        null
      ) {
        return Response.json(
          {
            success: false,
            error:
              "The delivery fee has not yet been confirmed by Yetop.",
          },
          { status: 409 }
        );
      }

      if (
        String(
          order.deliveryFeePaymentStatus
        ) === "PAID"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "The delivery fee has already been paid.",
          },
          { status: 409 }
        );
      }

      if (
        String(
          order.deliveryFeePaymentStatus
        ) !==
        "AWAITING_PAYMENT"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "The delivery fee is not currently awaiting payment.",
          },
          { status: 409 }
        );
      }
    }

    /*
     * Load active bank accounts.
     */
    const accounts =
      await db.orm.public.PaymentAccount.all();

    const activeAccounts =
      accounts
        .filter(
          (account) =>
            Boolean(account.isActive)
        )
        .map((account) => ({
          id: String(
            account.id
          ),

          bankName:
            String(
              account.bankName
            ),

          accountName:
            String(
              account.accountName
            ),

          accountNumber:
            String(
              account.accountNumber
            ),

          instructions:
            account.instructions
              ? String(
                  account.instructions
                )
              : null,

          displayOrder:
            Number(
              account.displayOrder
            ),
        }))
        .sort(
          (a, b) =>
            a.displayOrder -
            b.displayOrder
        );

    if (
      activeAccounts.length ===
      0
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Payment is temporarily unavailable. Please contact Yetop Stores.",
        },
        { status: 503 }
      );
    }

    /*
     * Payment amount is based on
     * payment type.
     */
    const amount =
      paymentType === "DELIVERY"
        ? Number(
            String(
              order.deliveryFee
            )
          )
        : Number(
            String(
              order.productsTotal
            )
          );

    return Response.json({
      success: true,

      paymentType,

      order: {
        id: String(order.id),

        orderNumber:
          String(
            order.orderNumber
          ),

        status:
          orderStatus,

        /*
         * PRODUCT payment amount.
         */
        productsTotal:
          Number(
            String(
              order.productsTotal
            )
          ),

        /*
         * Delivery amount.
         */
        deliveryFee:
          order.deliveryFee !==
          null
            ? Number(
                String(
                  order.deliveryFee
                )
              )
            : null,

        /*
         * Amount this particular
         * payment page is requesting.
         */
        amount,

        customerName:
          String(
            order.customerName
          ),

        deliveryPreference:
          String(
            order.deliveryPreference
          ),
      },

      accounts:
        activeAccounts,
    });
  } catch (error) {
    console.error(
      "Failed to load payment details:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load payment details.",
      },
      { status: 500 }
    );
  }
}


/*
 * POST PAYMENT
 *
 * Supports:
 *
 * PRODUCT
 * DELIVERY
 */
export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const orderNumberValue =
      formData.get(
        "orderNumber"
      );

    const phoneValue =
      formData.get("phone");

    const paymentTypeValue =
      formData.get(
        "paymentType"
      );

    const paymentAccountIdValue =
      formData.get(
        "paymentAccountId"
      );

    const paymentReferenceValue =
      formData.get(
        "paymentReference"
      );

    const evidenceValue =
      formData.get("evidence");

    const orderNumber =
      typeof orderNumberValue ===
      "string"
        ? orderNumberValue.trim()
        : "";

    const phone =
      typeof phoneValue ===
      "string"
        ? phoneValue.trim()
        : "";

    const paymentType =
      normalizePaymentType(
        paymentTypeValue
      );

    const paymentAccountId =
      typeof paymentAccountIdValue ===
      "string"
        ? paymentAccountIdValue.trim()
        : "";

    const paymentReference =
      typeof paymentReferenceValue ===
      "string"
        ? paymentReferenceValue.trim()
        : "";

    const evidence =
      evidenceValue instanceof File
        ? evidenceValue
        : null;

    /*
     * Basic validation.
     */
    if (
      !orderNumber ||
      !phone ||
      !paymentAccountId
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Order number, phone number and payment account are required.",
        },
        { status: 400 }
      );
    }

    if (!evidence) {
      return Response.json(
        {
          success: false,
          error:
            "Please upload your payment receipt.",
        },
        { status: 400 }
      );
    }

    /*
     * Allowed receipt formats.
     */
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (
      !allowedTypes.includes(
        evidence.type
      )
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Payment evidence must be JPG, PNG or PDF.",
        },
        { status: 400 }
      );
    }

    /*
     * Maximum upload size: 5 MB.
     */
    const maxFileSize =
      5 * 1024 * 1024;

    if (
      evidence.size >
      maxFileSize
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Payment evidence must not exceed 5 MB.",
        },
        { status: 400 }
      );
    }

    /*
     * Find order.
     */
    const orders =
      await db.orm.public.Order.all();

    const order = orders.find(
      (item) =>
        String(item.orderNumber)
          .toUpperCase() ===
          orderNumber.toUpperCase() &&
        String(item.customerPhone) ===
          phone
    );

    if (!order) {
      return Response.json(
        {
          success: false,
          error:
            "Order not found. Please check your order number and phone number.",
        },
        { status: 404 }
      );
    }

    const orderStatus =
      String(order.status);

    /*
     * Validate payment type.
     */
    if (
      paymentType ===
      "PRODUCT"
    ) {
      if (
        orderStatus !==
        "AWAITING_PAYMENT"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "This order is not currently awaiting product payment.",
          },
          { status: 409 }
        );
      }
    }

    if (
      paymentType ===
      "DELIVERY"
    ) {
      if (
        orderStatus !==
        "FULFILMENT"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Delivery payment is only available after product payment has been verified.",
          },
          { status: 409 }
        );
      }

      if (
        String(
          order.deliveryPreference
        ) !==
        "YETOP_DELIVERY"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "This order does not require a delivery payment.",
          },
          { status: 409 }
        );
      }

      if (
        order.deliveryFee ===
        null
      ) {
        return Response.json(
          {
            success: false,
            error:
              "The delivery fee has not yet been confirmed.",
          },
          { status: 409 }
        );
      }

      if (
        String(
          order.deliveryFeePaymentStatus
        ) !==
        "AWAITING_PAYMENT"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "The delivery fee is not currently awaiting payment.",
          },
          { status: 409 }
        );
      }
    }

    /*
     * Find selected active payment account.
     */
    const accounts =
      await db.orm.public.PaymentAccount.all();

    const paymentAccount =
      accounts.find(
        (account) =>
          String(account.id) ===
            paymentAccountId &&
          Boolean(
            account.isActive
          )
      );

    if (!paymentAccount) {
      return Response.json(
        {
          success: false,
          error:
            "The selected payment account is no longer available. Please refresh the page and choose an active account.",
        },
        { status: 409 }
      );
    }

    /*
     * Check existing payment ONLY
     * for this payment type.
     *
     * This allows one PRODUCT payment
     * and one DELIVERY payment.
     */
    const payments =
      await db.orm.public.Payment.all();

    const existingPayment =
      payments.find(
        (payment) =>
          String(
            payment.orderId
          ) === String(order.id) &&
          String(
            payment.paymentType ||
              "PRODUCT"
          ) === paymentType &&
          (
            String(
              payment.status
            ) === "PENDING" ||
            String(
              payment.status
            ) === "VERIFIED"
          )
      );

    if (existingPayment) {
      return Response.json(
        {
          success: false,
          error:
            String(
              existingPayment.status
            ) === "VERIFIED"
              ? `The ${paymentType.toLowerCase()} payment for this order has already been verified.`
              : `A ${paymentType.toLowerCase()} payment submission for this order is already awaiting verification.`,
        },
        { status: 409 }
      );
    }

    /*
     * Convert receipt to Buffer.
     */
    const fileBuffer =
      Buffer.from(
        await evidence.arrayBuffer()
      );

    /*
     * Determine extension.
     */
    const originalExtension =
      evidence.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const extension =
      originalExtension ===
      "jpeg"
        ? "jpg"
        : originalExtension ===
            "jpg"
          ? "jpg"
          : originalExtension ===
              "png"
            ? "png"
            : originalExtension ===
                "pdf"
              ? "pdf"
              : null;

    if (!extension) {
      return Response.json(
        {
          success: false,
          error:
            "Unable to determine a valid receipt file type.",
        },
        { status: 400 }
      );
    }

    /*
     * Safe Storage folder.
     */
    const safeOrderNumber =
      String(
        order.orderNumber
      ).replace(
        /[^a-zA-Z0-9_-]/g,
        ""
      );

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const storagePath =
      `${safeOrderNumber}/${paymentType.toLowerCase()}-${fileName}`;

    /*
     * Upload receipt.
     */
    const {
      error: uploadError,
    } =
      await supabaseAdmin.storage
        .from(
          "payment-evidence"
        )
        .upload(
          storagePath,
          fileBuffer,
          {
            contentType:
              evidence.type,

            upsert: false,
          }
        );

    if (uploadError) {
      console.error(
        "Payment evidence upload failed:",
        uploadError
      );

      return Response.json(
        {
          success: false,
          error:
            "Unable to upload payment receipt. Please try again.",
        },
        { status: 500 }
      );
    }

    try {
      /*
       * IMPORTANT:
       *
       * PRODUCT payment =
       * productsTotal only.
       *
       * DELIVERY payment =
       * deliveryFee only.
       */
      const paymentAmount =
        paymentType ===
        "DELIVERY"
          ? order.deliveryFee
          : order.productsTotal;

      if (
        paymentAmount ===
        null
      ) {
        throw new Error(
          "PAYMENT_AMOUNT_NOT_AVAILABLE"
        );
      }

      const now =
        Temporal.Now.instant();

      const payment =
        await db.orm.public.Payment.create(
          {
            id:
              crypto.randomUUID(),

            status:
              "PENDING",

            paymentType:
              paymentType,

            amount:
              paymentAmount,

            paymentReference:
              paymentReference ||
              null,

            evidenceUrl:
              storagePath,

            submittedAt:
              now,

            createdAt:
              now,

            updatedAt:
              now,

            orderId:
              order.id,

            paymentAccountId:
              paymentAccount.id,

            paidToBankName:
              String(
                paymentAccount.bankName
              ),

            paidToAccountName:
              String(
                paymentAccount.accountName
              ),

            paidToAccountNumber:
              String(
                paymentAccount.accountNumber
              ),
          }
        );

      return Response.json(
        {
          success: true,

          message:
            paymentType ===
            "DELIVERY"
              ? "Delivery payment submitted successfully. Yetop will verify your payment."
              : "Payment submitted successfully. Your payment is now awaiting verification by Yetop Stores.",

          payment: {
            id:
              String(
                payment.id
              ),

            status:
              String(
                payment.status
              ),

            paymentType:
              String(
                payment.paymentType
              ),

            amount:
              String(
                payment.amount
              ),

            paymentReference:
              payment.paymentReference
                ? String(
                    payment.paymentReference
                  )
                : null,

            submittedAt:
              payment.submittedAt
                ? String(
                    payment.submittedAt
                  )
                : null,
          },

          order: {
            orderNumber:
              String(
                order.orderNumber
              ),

            status:
              String(
                order.status
              ),
          },
        },
        { status: 201 }
      );
    } catch (databaseError) {
      /*
       * Delete uploaded receipt if
       * database creation fails.
       */
      const {
        error: deleteError,
      } =
        await supabaseAdmin.storage
          .from(
            "payment-evidence"
          )
          .remove([
            storagePath,
          ]);

      if (deleteError) {
        console.error(
          "Failed to remove orphaned payment evidence:",
          deleteError
        );
      }

      throw databaseError;
    }
  } catch (error) {
    console.error(
      "Failed to submit payment:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "PAYMENT_AMOUNT_NOT_AVAILABLE"
    ) {
      return Response.json(
        {
          success: false,
          error:
            "The payment amount is not available.",
        },
        { status: 409 }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          "Unable to submit payment details.",
      },
      { status: 500 }
    );
  }
}