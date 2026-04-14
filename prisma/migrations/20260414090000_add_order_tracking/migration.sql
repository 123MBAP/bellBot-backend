-- Add new enum values for order tracking
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RECEIVED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKAGING';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';

-- Add tracking columns to Order
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "underReviewAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "packagingAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "outForDeliveryAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "packagingEtaMinutes" INTEGER,
ADD COLUMN IF NOT EXISTS "deliveryEtaMinutes" INTEGER,
ADD COLUMN IF NOT EXISTS "transportMethod" TEXT,
ADD COLUMN IF NOT EXISTS "transportPlateNumber" TEXT;

-- Helpful index for filtering orders by status
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
