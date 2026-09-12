-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pen_brands" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "countryOfOrigin" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pen_models" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "inkType" TEXT,
    "barrelVisibility" TEXT NOT NULL DEFAULT 'unknown',
    "flowCategory" TEXT,
    "nominalMileageM" REAL,
    "communityMileageM" REAL,
    "imageUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pen_models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "pen_brands" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pen_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "countryCode" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pen_claims" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "penModelId" TEXT NOT NULL,
    "sourceId" TEXT,
    "purchasedAt" TEXT,
    "mileageClaimed" REAL,
    "inkFlowRating" INTEGER,
    "notes" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pen_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pen_claims_penModelId_fkey" FOREIGN KEY ("penModelId") REFERENCES "pen_models" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pen_claims_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "pen_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "penModelId" TEXT,
    "predictedMileageM" REAL NOT NULL,
    "confidence" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "resultJson" TEXT,
    "metadata" TEXT,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "predictions_penModelId_fkey" FOREIGN KEY ("penModelId") REFERENCES "pen_models" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "search_lookups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "penModelId" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clientIpHash" TEXT,
    "searchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "rawResult" TEXT,
    "pendingClaimsCreated" INTEGER NOT NULL DEFAULT 0,
    "brand" TEXT,
    "model" TEXT,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    CONSTRAINT "search_lookups_penModelId_fkey" FOREIGN KEY ("penModelId") REFERENCES "pen_models" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" TEXT,
    "clientIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_logs_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pen_brands_slug_key" ON "pen_brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pen_models_slug_key" ON "pen_models"("slug");
