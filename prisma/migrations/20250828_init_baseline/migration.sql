-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."Member" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "isModerator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RoleMapping" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "discordRole" TEXT NOT NULL,

    CONSTRAINT "RoleMapping_pkey" PRIMARY KEY ("id")
);

