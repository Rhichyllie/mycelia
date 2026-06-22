import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

import { AppError } from "../../lib/app-error";
import { prisma } from "../db/client";
import { getMyceliaDemoDatabaseConfig } from "../db/demo-config";

import type { SupportedAuthRuntimeMode } from "./auth-runtime";

const AppUserSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  email: z.string().email(),
  emailNormalized: z.string().email(),
  displayName: z.string().max(120).nullable(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AppUserRecord = z.infer<typeof AppUserSchema>;

export type AuthenticatedActor = {
  userId: string;
  tenantId: string;
  email: string;
  displayName?: string;
  providerId: string;
  authMode: SupportedAuthRuntimeMode;
};

type AuthProviderType = "development_credentials" | "oidc";

type AuthUserStoreClient = PrismaClient;

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function normalizeDisplayName(input?: string | null) {
  const trimmed = input?.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

function toAuthenticatedActor(input: {
  user: AppUserRecord;
  providerId: string;
  authMode: SupportedAuthRuntimeMode;
}): AuthenticatedActor {
  return {
    userId: input.user.id,
    tenantId: input.user.tenantId,
    email: input.user.email,
    ...(input.user.displayName ? { displayName: input.user.displayName } : {}),
    providerId: input.providerId,
    authMode: input.authMode,
  };
}

async function findUserByIdTx(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<AppUserRecord | null> {
  const user = await tx.appUser.findUnique({
    where: { id: userId },
  });

  return user ? AppUserSchema.parse(user) : null;
}

async function upsertUserByEmailTx(input: {
  tx: Prisma.TransactionClient;
  tenantId: string;
  email: string;
  displayName?: string | null;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const displayName = normalizeDisplayName(input.displayName);
  const updateData = {
    email: normalizedEmail,
    ...(displayName ? { displayName } : {}),
  };

  const user = await input.tx.appUser.upsert({
    where: {
      tenantId_emailNormalized: {
        tenantId: input.tenantId,
        emailNormalized: normalizedEmail,
      },
    },
    update: updateData,
    create: {
      tenantId: input.tenantId,
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      displayName,
      active: true,
    },
  });

  return AppUserSchema.parse(user);
}

async function updateExistingUserTx(input: {
  tx: Prisma.TransactionClient;
  tenantId: string;
  userId: string;
  email: string;
  displayName?: string | null;
}) {
  const normalizedEmail = normalizeEmail(input.email);
  const displayName = normalizeDisplayName(input.displayName);
  const conflictingUser = await input.tx.appUser.findFirst({
    where: {
      tenantId: input.tenantId,
      emailNormalized: normalizedEmail,
      id: { not: input.userId },
    },
    select: { id: true },
  });

  if (conflictingUser !== null) {
    throw new AppError(
      "A identidade autenticada conflita com um usuario existente no MYCELIA.",
      {
        code: "AUTH_EMAIL_CONFLICT",
        status: 409,
      },
    );
  }

  const user = await input.tx.appUser.update({
    where: { id: input.userId },
    data: {
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      ...(displayName ? { displayName } : {}),
    },
  });

  return AppUserSchema.parse(user);
}

export async function findAppUserById(
  userId: string,
  client: AuthUserStoreClient = prisma,
) {
  const user = await client.appUser.findUnique({
    where: { id: userId },
  });

  return user ? AppUserSchema.parse(user) : null;
}

export async function findActiveAppUserById(
  userId: string,
  client: AuthUserStoreClient = prisma,
) {
  const user = await findAppUserById(userId, client);

  if (!user || !user.active) {
    return null;
  }

  return user;
}

export async function upsertAppUserByEmail(input: {
  tenantId?: string;
  email: string;
  displayName?: string | null;
  client?: AuthUserStoreClient;
}) {
  if (!input.email.trim()) {
    throw new AppError("Nao foi possivel provisionar usuario sem email.", {
      code: "AUTH_EMAIL_REQUIRED",
      status: 400,
    });
  }

  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;

  return client.$transaction((tx) =>
    upsertUserByEmailTx({
      tx,
      tenantId,
      email: input.email,
      displayName: input.displayName,
    }),
  );
}

export async function syncAuthenticatedActor(input: {
  tenantId?: string;
  providerId: string;
  providerType: AuthProviderType;
  subject: string;
  email: string;
  displayName?: string | null;
  authMode: SupportedAuthRuntimeMode;
  client?: AuthUserStoreClient;
}) {
  const email = normalizeEmail(input.email);
  const subject = input.subject.trim();
  const providerId = input.providerId.trim();
  const client = input.client ?? prisma;
  const tenantId = input.tenantId ?? getMyceliaDemoDatabaseConfig().tenantId;

  if (!email) {
    throw new AppError(
      "O provedor autenticou o usuario sem um email utilizavel para o MYCELIA.",
      {
        code: "AUTH_EMAIL_REQUIRED",
        status: 403,
      },
    );
  }

  if (!subject) {
    throw new AppError(
      "O provedor autenticou o usuario sem um subject estavel para o MYCELIA.",
      {
        code: "AUTH_SUBJECT_REQUIRED",
        status: 403,
      },
    );
  }

  if (!providerId) {
    throw new AppError("A autenticacao retornou um providerId invalido.", {
      code: "AUTH_PROVIDER_INVALID",
      status: 500,
    });
  }

  return client.$transaction(async (tx) => {
    const existingIdentity = await tx.authIdentity.findFirst({
      where: {
        providerId,
        subject,
      },
      include: { user: true },
    });

    if (existingIdentity !== null) {
      if (existingIdentity.user.tenantId !== tenantId) {
        throw new AppError(
          "A identidade externa autenticada conflita com outro tenant.",
          {
            code: "AUTH_IDENTITY_CONFLICT",
            status: 409,
          },
        );
      }

      if (!existingIdentity.user.active) {
        throw new AppError("O usuario autenticado esta desativado no MYCELIA.", {
          code: "AUTH_USER_DISABLED",
          status: 403,
        });
      }

      const updatedUser = await updateExistingUserTx({
        tx,
        tenantId,
        userId: existingIdentity.userId,
        email,
        displayName: input.displayName,
      });

      await tx.authIdentity.update({
        where: { id: existingIdentity.id },
        data: {
          emailAtLogin: email,
          lastSeenAt: new Date(),
        },
      });

      return toAuthenticatedActor({
        user: updatedUser,
        providerId,
        authMode: input.authMode,
      });
    }

    const conflictingIdentity = await tx.authIdentity.findFirst({
      where: {
        providerId,
        subject: { not: subject },
        user: {
          tenantId,
          emailNormalized: email,
        },
      },
      select: { id: true, userId: true, subject: true },
    });

    if (conflictingIdentity !== null) {
      throw new AppError(
        "A identidade externa autenticada conflita com um usuario interno ja vinculado a outro subject.",
        {
          code: "AUTH_IDENTITY_CONFLICT",
          status: 409,
        },
      );
    }

    const user = await upsertUserByEmailTx({
      tx,
      tenantId,
      email,
      displayName: input.displayName,
    });

    const identity = await tx.authIdentity.upsert({
      where: {
        providerId_subject: {
          providerId,
          subject,
        },
      },
      update: {
        emailAtLogin: email,
        lastSeenAt: new Date(),
      },
      create: {
        id: randomUUID(),
        userId: user.id,
        providerType: input.providerType,
        providerId,
        subject,
        emailAtLogin: email,
        lastSeenAt: new Date(),
      },
    });

    const resolvedUser =
      identity.userId === user.id ? user : await findUserByIdTx(tx, identity.userId);

    if (!resolvedUser || !resolvedUser.active) {
      throw new AppError(
        "Nao foi possivel resolver o usuario autenticado do MYCELIA.",
        {
          code: "AUTH_USER_NOT_FOUND",
          status: 401,
        },
      );
    }

    return toAuthenticatedActor({
      user: resolvedUser,
      providerId,
      authMode: input.authMode,
    });
  });
}

