CREATE TABLE "app_users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "emailNormalized" TEXT NOT NULL,
  "displayName" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "auth_identities" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "providerType" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "emailAtLogin" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "lastSeenAt" DATETIME,
  CONSTRAINT "auth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "app_users_emailNormalized_key" ON "app_users" ("emailNormalized");
CREATE INDEX "app_users_emailNormalized_idx" ON "app_users" ("emailNormalized");

CREATE UNIQUE INDEX "auth_identities_providerId_subject_key" ON "auth_identities" ("providerId", "subject");
CREATE INDEX "auth_identities_userId_idx" ON "auth_identities" ("userId");
