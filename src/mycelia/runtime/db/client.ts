import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  myceliaPrisma?: PrismaClient;
};

export const prisma = globalForPrisma.myceliaPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.myceliaPrisma = prisma;
}

export type MyceliaPrismaClient = PrismaClient;
