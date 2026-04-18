-- This migration reconciles drift for databases that already have Advert/ShowroomVideo created
-- outside of Prisma migrations (e.g. via db push / manual SQL).
-- For an existing database, you may mark it as applied via:
--   npx prisma migrate resolve --applied 20260418115000_reconcile_existing_advert_showroom

-- 1) Adverts: enum + table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdvertMediaType') THEN
    CREATE TYPE "AdvertMediaType" AS ENUM ('IMAGE', 'VIDEO');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Advert" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "productLink" TEXT NOT NULL,
  "mediaType" "AdvertMediaType" NOT NULL DEFAULT 'IMAGE',
  "imageUrl" TEXT,
  "imagePublicId" TEXT,
  "videoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Advert_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Advert_isActive_idx" ON "Advert"("isActive");
CREATE INDEX IF NOT EXISTS "Advert_createdAt_idx" ON "Advert"("createdAt");

-- 2) Showroom videos: table + indexes
CREATE TABLE IF NOT EXISTS "ShowroomVideo" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "productLink" TEXT NOT NULL,
  "videoUrl" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShowroomVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ShowroomVideo_isActive_idx" ON "ShowroomVideo"("isActive");
CREATE INDEX IF NOT EXISTS "ShowroomVideo_createdAt_idx" ON "ShowroomVideo"("createdAt");

-- 3) Support messages: remove adminId foreign key (schema no longer has relation)
ALTER TABLE "SupportMessage" DROP CONSTRAINT IF EXISTS "SupportMessage_adminId_fkey";

-- 4) Products: align list-field defaults (DB has no default; Prisma writes arrays explicitly)
ALTER TABLE "Product" ALTER COLUMN "imageUrls" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "imagePublicIds" DROP DEFAULT;
