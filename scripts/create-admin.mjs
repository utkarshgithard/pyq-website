import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const username = args[0]?.trim();
  const password = args[1];

  if (!username || !password) {
    console.error("❌ Usage: node scripts/create-admin.mjs <username> <password>");
    console.error("   Example: node scripts/create-admin.mjs admin2 mySecurePassword123");
    process.exit(1);
  }

  if (username.length < 3) {
    console.error("❌ Username must be at least 3 characters long.");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ Password must be at least 12 characters long.");
    process.exit(1);
  }

  const existing = await prisma.admin.findUnique({
    where: { username },
  });

  if (existing) {
    console.error(`❌ An admin with the username "${username}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.admin.create({
    data: { username, passwordHash },
  });

  console.log(`✅ Admin account created successfully in Supabase:`);
  console.log(`   ID:       ${admin.id}`);
  console.log(`   Username: ${admin.username}`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to create admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
