import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { randomUUID } from "crypto";

export async function GET() {
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

    const accounts =
      await db.orm.public.PaymentAccount.all();

    const paymentAccounts = accounts
      .map((account) => ({
        id: String(account.id),
        bankName: String(account.bankName),
        accountName: String(account.accountName),
        accountNumber: String(
          account.accountNumber
        ),
        instructions:
          account.instructions
            ? String(account.instructions)
            : null,
        isActive: Boolean(
          account.isActive
        ),
        displayOrder: Number(
          account.displayOrder
        ),
        createdAt: String(
          account.createdAt
        ),
        updatedAt: String(
          account.updatedAt
        ),
      }))
      .sort(
        (a, b) =>
          a.displayOrder -
          b.displayOrder
      );

    return Response.json({
      success: true,
      accounts: paymentAccounts,
    });
  } catch (error) {
    console.error(
      "Failed to fetch payment accounts:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to load payment accounts.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const session =
      await getAdminSession();

    if (!session) {
      return Response.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const bankName =
      typeof body.bankName === "string"
        ? body.bankName.trim()
        : "";

    const accountName =
      typeof body.accountName === "string"
        ? body.accountName.trim()
        : "";

    const accountNumber =
      typeof body.accountNumber === "string"
        ? body.accountNumber.trim()
        : "";

    const instructions =
      typeof body.instructions === "string"
        ? body.instructions.trim()
        : "";

    const isActive =
      typeof body.isActive === "boolean"
        ? body.isActive
        : true;

    const displayOrder =
      Number.isInteger(body.displayOrder)
        ? body.displayOrder
        : 0;

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

    /*
     * Basic account-number validation.
     *
     * We keep this flexible because different
     * payment providers may use different formats.
     */
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
     * Check before attempting to create the
     * account so the admin gets a clear message
     * instead of a database constraint error.
     */
    const existingAccounts =
      await db.orm.public.PaymentAccount.all();

    const duplicateDisplayOrder =
      existingAccounts.some(
        (account) =>
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

    const account =
      await db.orm.public.PaymentAccount.create(
        {
          id: randomUUID(),
          bankName,
          accountName,
          accountNumber,
          instructions:
            instructions || null,
          isActive,
          displayOrder,
        }
      );

    return Response.json(
      {
        success: true,
        account: {
          id: String(account.id),
          bankName: String(
            account.bankName
          ),
          accountName: String(
            account.accountName
          ),
          accountNumber: String(
            account.accountNumber
          ),
          instructions:
            account.instructions
              ? String(
                  account.instructions
                )
              : null,
          isActive: Boolean(
            account.isActive
          ),
          displayOrder: Number(
            account.displayOrder
          ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create payment account:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to create payment account.",
      },
      { status: 500 }
    );
  }
}