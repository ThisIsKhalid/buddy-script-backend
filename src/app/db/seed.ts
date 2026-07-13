/* eslint-disable no-console */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const seedUsers = [
  {
    email: "superadmin@example.com",
    firstName: "Super",
    lastName: "Admin",
    password: "SuperAdmin@123",
    role: Role.ADMIN,
  },
  {
    email: "testuser@example.com",
    firstName: "Test",
    lastName: "User",
    password: "TestUser@123",
    role: Role.USER,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  for (const userData of seedUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`⚠️ User with email ${userData.email} already exists. Skipping...`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash: hashedPassword,
        role: userData.role,
      },
    });

    console.log(
      `✅ Role: ${userData.role} - User: ${userData.email} Pass: ${userData.password} created.`
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
