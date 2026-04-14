-- Add productScroll flag for homepage/catalog scroller
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "productScroll" BOOLEAN NOT NULL DEFAULT false;
