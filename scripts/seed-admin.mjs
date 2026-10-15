import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.admin.count();
  if (existingCount > 0) {
    console.log("⚠️  An admin account already exists in this database.");
    console.log("   Seed script skipped to protect existing credentials.");
    return;
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || "123456789101112";
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  const admin = await prisma.admin.create({
    data: { username, passwordHash },
  });

  console.log(`✅ Initial admin account created in Supabase:`);
  console.log(`   Username: ${admin.username}`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to seed admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
