import { db } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Temporal } from "@js-temporal/polyfill";



export async function POST(
    request: Request
  ) {
    try {
      const formData = await request.formData();
  
      const orderNumberValue =
        formData.get("orderNumber");
  
      const phoneValue =
        formData.get("phone");
  
      const paymentAccountIdValue =
        formData.get("paymentAccountId");
  
      const paymentReferenceValue =
        formData.get("paymentReference");
  
      const evidenceValue =
        formData.get("evidence");
  
      const orderNumber =
        typeof orderNumberValue === "string"
          ? orderNumberValue.trim()
          : "";
  
      const phone =
        typeof phoneValue === "string"
          ? phoneValue.trim()
          : "";
  
      const paymentAccountId =
        typeof paymentAccountIdValue === "string"
          ? paymentAccountIdValue.trim()
          : "";
  
      const paymentReference =
        typeof paymentReferenceValue === "string"
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
  
      if (!allowedTypes.includes(evidence.type)) {
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
  
      if (evidence.size > maxFileSize) {
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
       * Find the order using both order number
       * and phone number.
       */
      const orders =
        await db.orm.public.Order.all();
  
      const order = orders.find(
        (item) =>
          String(item.orderNumber)
            .toUpperCase() ===
            orderNumber.toUpperCase() &&
          String(item.customerPhone) === phone
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
  
      /*
       * Payment is only allowed after
       * Yetop approves the order.
       */
      if (
        String(order.status) !==
        "AWAITING_PAYMENT"
      ) {
        return Response.json(
          {
            success: false,
            error:
              "This order is not currently awaiting payment.",
          },
          { status: 409 }
        );
      }
  
      /*
       * Get the selected active payment account.
       */
      const accounts =
        await db.orm.public.PaymentAccount.all();
  
      const paymentAccount =
        accounts.find(
          (account) =>
            String(account.id) ===
              paymentAccountId &&
            Boolean(account.isActive)
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
       * Check existing payments for this order.
       *
       * We allow another submission only if the
       * previous payment was rejected.
       */
      const payments =
        await db.orm.public.Payment.all();
  
      const existingPayments =
        payments.filter(
          (payment) =>
            String(payment.orderId) ===
            String(order.id)
        );
  
      const activePayment =
        existingPayments.find(
          (payment) =>
            String(payment.status) ===
              "PENDING" ||
            String(payment.status) ===
              "VERIFIED"
        );
  
      if (activePayment) {
        return Response.json(
          {
            success: false,
            error:
              String(activePayment.status) ===
              "VERIFIED"
                ? "Payment for this order has already been verified."
                : "A payment submission for this order is already awaiting verification.",
          },
          { status: 409 }
        );
      }
  
      /*
       * Convert uploaded receipt to a Buffer.
       */
      const fileBuffer =
        Buffer.from(
          await evidence.arrayBuffer()
        );
  
      /*
       * Determine a safe file extension.
       */
      const originalExtension =
        evidence.name
          .split(".")
          .pop()
          ?.toLowerCase();
  
      const extension =
        originalExtension === "jpeg"
          ? "jpg"
          : originalExtension === "jpg"
            ? "jpg"
            : originalExtension === "png"
              ? "png"
              : originalExtension === "pdf"
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
       * Create a safe storage path.
       *
       * Example:
       * YETF2MSR/550e8400-e29b-41d4-a716-446655440000.jpg
       */
      const safeOrderNumber =
        String(order.orderNumber).replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        );
  
      const fileName =
        `${crypto.randomUUID()}.${extension}`;
  
      const storagePath =
        `${safeOrderNumber}/${fileName}`;
  
      /*
       * Upload receipt to the PRIVATE
       * payment-evidence bucket.
       */
      const {
        error: uploadError,
      } = await supabaseAdmin.storage
        .from("payment-evidence")
        .upload(
          storagePath,
          fileBuffer,
          {
            contentType: evidence.type,
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
  
      /*
       * Payment amount.
       *
       * Approved orders should normally have a
       * grandTotal. Fall back to productsTotal
       * if delivery fee is still pending.
       */
      const paymentAmount =
        order.grandTotal ??
        order.productsTotal;
  
      try {
        /*
         * Create the payment record.
         */
        const payment =
          await db.orm.public.Payment.create({
            id: crypto.randomUUID(),
  
            status: "PENDING",
  
            amount: paymentAmount,
  
            paymentReference:
              paymentReference || null,
  
            /*
             * This is intentionally the private
             * Supabase Storage path, not a public URL.
             */
            evidenceUrl:
              storagePath,
  
            submittedAt:
              Temporal.Now.instant(),
  
            createdAt:
              Temporal.Now.instant(),
  
            updatedAt:
              Temporal.Now.instant(),
  
            orderId:
              order.id,
  
            paymentAccountId:
              paymentAccount.id,
  
            /*
             * Snapshot the account details used
             * by the customer at payment time.
             */
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
          });
  
        return Response.json(
          {
            success: true,
  
            message:
              "Payment submitted successfully. Your payment is now awaiting verification by Yetop Stores.",
  
            payment: {
              id: String(payment.id),
              status: String(
                payment.status
              ),
              amount: String(
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
                String(order.status),
            },
          },
          { status: 201 }
        );
      } catch (databaseError) {
        /*
         * If the database insert fails after the
         * file has been uploaded, remove the file
         * so we don't leave an orphaned receipt.
         */
        const {
          error: deleteError,
        } = await supabaseAdmin.storage
          .from("payment-evidence")
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