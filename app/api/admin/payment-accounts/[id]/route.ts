import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { Temporal } from "@js-temporal/polyfill";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
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
          error:
            "Payment account ID is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    /*
     * Get all accounts so we can:
     * 1. Find the account being edited.
     * 2. Check display-order uniqueness.
     */
    const accounts =
      await db.orm.public.PaymentAccount.all();

    const existingAccount =
      accounts.find(
        (account) =>
          String(account.id) === id
      );

    if (!existingAccount) {
      return Response.json(
        {
          success: false,
          error:
            "Payment account not found.",
        },
        { status: 404 }
      );
    }

    const bankName =
      body.bankName !== undefined
        ? String(body.bankName).trim()
        : String(existingAccount.bankName);

    const accountName =
      body.accountName !== undefined
        ? String(body.accountName).trim()
        : String(
            existingAccount.accountName
          );

    const accountNumber =
      body.accountNumber !== undefined
        ? String(body.accountNumber).trim()
        : String(
            existingAccount.accountNumber
          );

    const instructions =
      body.instructions !== undefined
        ? String(body.instructions).trim()
        : existingAccount.instructions
          ? String(
              existingAccount.instructions
            )
          : "";

    const isActive =
      body.isActive !== undefined
        ? Boolean(body.isActive)
        : Boolean(
            existingAccount.isActive
          );

    const displayOrder =
      body.displayOrder !== undefined &&
      Number.isInteger(body.displayOrder)
        ? body.displayOrder
        : Number(
            existingAccount.displayOrder
          );

    if (
      !bankName ||
      !accountName ||
      !accountNumber
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Bank name, account name and account number are required.",
        },
        { status: 400 }
      );
    }

    if (
      accountNumber.length < 6 ||
      accountNumber.length > 30
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Please provide a valid account number.",
        },
        { status: 400 }
      );
    }

    /*
     * Display order must be unique.
     *
     * Ignore the account currently being edited,
     * because it is allowed to keep its own
     * existing display order.
     */
    const duplicateDisplayOrder =
      accounts.some(
        (account) =>
          String(account.id) !== id &&
          Number(account.displayOrder) ===
            displayOrder
      );

    if (duplicateDisplayOrder) {
      return Response.json(
        {
          success: false,
          error: `Display order ${displayOrder} is already in use. Please choose another position.`,
        },
        { status: 409 }
      );
    }

    /*
     * Prisma 8 update syntax:
     *
     * Model.where(filter).update(data)
     */
    const updatedAccount =
      await db.orm.public.PaymentAccount
        .where({ id })
        .update({
          bankName,
          accountName,
          accountNumber,
          instructions:
            instructions || null,
          isActive,
          displayOrder,
          updatedAt:
            Temporal.Now.instant(),
        });

    if (!updatedAccount) {
      return Response.json(
        {
          success: false,
          error:
            "Payment account could not be updated.",
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      account: {
        id: String(
          updatedAccount.id
        ),

        bankName:
          String(
            updatedAccount.bankName
          ),

        accountName:
          String(
            updatedAccount.accountName
          ),

        accountNumber:
          String(
            updatedAccount.accountNumber
          ),

        instructions:
          updatedAccount.instructions
            ? String(
                updatedAccount.instructions
              )
            : null,

        isActive:
          Boolean(
            updatedAccount.isActive
          ),

        displayOrder:
          Number(
            updatedAccount.displayOrder
          ),

        updatedAt:
          String(
            updatedAccount.updatedAt
          ),
      },
    });
  } catch (error) {
    console.error(
      "Failed to update payment account:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to update payment account.",
      },
      { status: 500 }
    );
  }
}