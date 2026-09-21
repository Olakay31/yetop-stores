import {
    getAdminCookieName,
  } from "@/lib/admin-session";
  
  export async function POST() {
    const response =
      Response.json({
        success: true,
      });
  
    response.headers.append(
      "Set-Cookie",
      [
        `${getAdminCookieName()}=`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=0",
        process.env.NODE_ENV ===
          "production"
          ? "Secure"
          : "",
      ]
        .filter(Boolean)
        .join("; ")
    );
  
    return response;
  }