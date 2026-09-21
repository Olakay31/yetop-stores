import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import {
  createAdminSession,
  getAdminCookieName,
} from "@/lib/admin-session";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const email =
      String(
        body.email ?? ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body.password ?? ""
      );

    if (!email || !password) {
      return Response.json(
        {
          success: false,
          error:
            "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const admin =
      await db.orm.public.AdminUser
        .where({
          email,
        })
        .first();

    /*
     * Use the same generic error for an unknown
     * email and incorrect password.
     */
    if (!admin) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const isActive =
      Boolean(admin.isActive);

    if (!isActive) {
      return Response.json(
        {
          success: false,
          error:
            "This administrator account is inactive.",
        },
        { status: 403 }
      );
    }

    const passwordHash =
      String(
        admin.passwordHash
      );

    const passwordMatches =
      await bcrypt.compare(
        password,
        passwordHash
      );

    if (!passwordMatches) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const adminId =
      String(admin.id);

    const adminEmail =
      String(admin.email);

    const adminName =
      String(admin.fullName);

    const session =
      createAdminSession({
        id: adminId,
        email: adminEmail,
        fullName: adminName,
      });

    const response =
      Response.json({
        success: true,
        admin: {
          id: adminId,
          email: adminEmail,
          fullName: adminName,
        },
      });

    response.headers.append(
      "Set-Cookie",
      [
        `${getAdminCookieName()}=${session}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=28800",
        process.env.NODE_ENV ===
          "production"
          ? "Secure"
          : "",
      ]
        .filter(Boolean)
        .join("; ")
    );

    return response;
  } catch (error) {
    console.error(
      "Admin login failed:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Unable to sign in. Please try again.",
      },
      { status: 500 }
    );
  }
}