-- This migration aligns the migration history with the current Prisma schema.
-- It includes changes that may already exist in the target database.
-- If your database already has these objects, mark this migration as applied via:
--   npx prisma migrate resolve --applied 20260413130000_align_schema_with_existing_db

-- 1) User: add name + phone
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "phone" TEXT NOT NULL DEFAULT '';

-- 2) Orders: enum + table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
    CREATE TYPE "OrderStatus" AS ENUM ('ORDERED', 'PROCESSING', 'SHIPPED', 'DELIVERED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'ORDERED',
  "items" JSONB NOT NULL,
  "totalsByCurrency" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Order_userId_fkey'
  ) THEN
    ALTER TABLE "Order"
    ADD CONSTRAINT "Order_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 3) Products: migrate from legacy single-image columns to arrays
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "imagePublicIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill from legacy columns (if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'imageUrl'
  ) THEN
    UPDATE "Product"
    SET "imageUrls" = ARRAY["imageUrl"]
    WHERE "imageUrl" IS NOT NULL
      AND ("imageUrls" IS NULL OR array_length("imageUrls", 1) IS NULL);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'imagePublicId'
  ) THEN
    UPDATE "Product"
    SET "imagePublicIds" = ARRAY["imagePublicId"]
    WHERE "imagePublicId" IS NOT NULL
      AND ("imagePublicIds" IS NULL OR array_length("imagePublicIds", 1) IS NULL);
  END IF;
END $$;

-- Ensure list fields are non-null
UPDATE "Product" SET "sizes" = ARRAY[]::TEXT[] WHERE "sizes" IS NULL;
UPDATE "Product" SET "features" = ARRAY[]::TEXT[] WHERE "features" IS NULL;

ALTER TABLE "Product"
  ALTER COLUMN "sizes" SET NOT NULL,
  ALTER COLUMN "features" SET NOT NULL;

-- Drop legacy single-image columns if present
ALTER TABLE "Product"
  DROP COLUMN IF EXISTS "imageUrl",
  DROP COLUMN IF EXISTS "imagePublicId";
