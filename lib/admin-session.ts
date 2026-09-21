import {
    createHmac,
    timingSafeEqual,
  } from "node:crypto";
  import { cookies } from "next/headers";
  
  const COOKIE_NAME = "yetop-admin-session";
  
  type AdminSessionPayload = {
    id: string;
    email: string;
    fullName: string;
    exp: number;
  };
  
  function getSecret() {
    const secret =
      process.env.ADMIN_SESSION_SECRET;
  
    if (!secret) {
      throw new Error(
        "ADMIN_SESSION_SECRET is not configured."
      );
    }
  
    return secret;
  }
  
  function base64UrlEncode(
    value: string
  ) {
    return Buffer.from(value)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  function base64UrlDecode(
    value: string
  ) {
    return Buffer.from(
      value
        .replace(/-/g, "+")
        .replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
  }
  
  function createSignature(
    payload: string
  ) {
    return createHmac(
      "sha256",
      getSecret()
    )
      .update(payload)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }
  
  export function createAdminSession(
    admin: {
      id: string;
      email: string;
      fullName: string;
    }
  ) {
    const payload: AdminSessionPayload = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      exp:
        Math.floor(
          Date.now() / 1000
        ) +
        60 * 60 * 8,
    };
  
    const encodedPayload =
      base64UrlEncode(
        JSON.stringify(payload)
      );
  
    const signature =
      createSignature(
        encodedPayload
      );
  
    return `${encodedPayload}.${signature}`;
  }
  
  export function verifyAdminSession(
    token: string
  ) {
    try {
      const parts =
        token.split(".");
  
      if (parts.length !== 2) {
        return null;
      }
  
      const [
        encodedPayload,
        providedSignature,
      ] = parts;
  
      const expectedSignature =
        createSignature(
          encodedPayload
        );
  
      const providedBuffer =
        Buffer.from(
          providedSignature
        );
  
      const expectedBuffer =
        Buffer.from(
          expectedSignature
        );
  
      if (
        providedBuffer.length !==
        expectedBuffer.length
      ) {
        return null;
      }
  
      if (
        !timingSafeEqual(
          providedBuffer,
          expectedBuffer
        )
      ) {
        return null;
      }
  
      const payload =
        JSON.parse(
          base64UrlDecode(
            encodedPayload
          )
        ) as AdminSessionPayload;
  
      if (
        !payload.id ||
        !payload.email ||
        !payload.exp
      ) {
        return null;
      }
  
      if (
        payload.exp <
        Math.floor(Date.now() / 1000)
      ) {
        return null;
      }
  
      return payload;
    } catch {
      return null;
    }
  }
  
  export async function getAdminSession() {
    const cookieStore =
      await cookies();
  
    const token =
      cookieStore.get(
        COOKIE_NAME
      )?.value;
  
    if (!token) {
      return null;
    }
  
    return verifyAdminSession(
      token
    );
  }
  
  export function getAdminCookieName() {
    return COOKIE_NAME;
  }