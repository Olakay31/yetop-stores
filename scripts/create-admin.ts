import "dotenv/config";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { db } from "../lib/db";

async function main() {
  const rl = createInterface({
    input,
    output,
  });

  try {
    const email =
      "kayodeoladejo98@gmail.com";

    const fullName =
      await rl.question("Admin full name: ");

    const password =
      await rl.question("Admin password: ");

    if (!fullName.trim()) {
      throw new Error(
        "Admin full name is required."
      );
    }

    if (password.length < 8) {
      throw new Error(
        "Password must be at least 8 characters."
      );
    }

    const existingAdmin =
      await db.orm.public.AdminUser
        .where({ email })
        .first();

    if (existingAdmin) {
      console.log(
        `Admin account already exists for ${email}.`
      );

      return;
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const admin =
      await db.orm.public.AdminUser.create({
        id: crypto.randomUUID(),
        fullName: fullName.trim(),
        email,
        passwordHash,
        isActive: true,
      });

    console.log("");
    console.log(
      "✅ Admin account created successfully."
    );
    console.log(
      `Email: ${String(admin.email)}`
    );
    console.log(
      `Name: ${String(admin.fullName)}`
    );
  } finally {
    rl.close();
  }
}

main()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ Failed to create admin account:"
    );
    console.error(error);
    process.exit(1);
  });