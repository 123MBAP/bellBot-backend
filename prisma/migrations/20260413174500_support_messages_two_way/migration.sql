-- Add enum for sender role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupportSenderRole') THEN
    CREATE TYPE "SupportSenderRole" AS ENUM ('CUSTOMER', 'ADMIN');
  END IF;
END $$;

-- Add columns for two-way messaging
ALTER TABLE "SupportMessage"
  ADD COLUMN IF NOT EXISTS "senderRole" "SupportSenderRole" NOT NULL DEFAULT 'CUSTOMER',
  ADD COLUMN IF NOT EXISTS "adminId" TEXT;

-- Foreign key to User for adminId (optional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'SupportMessage_adminId_fkey'
    ) THEN
        ALTER TABLE "SupportMessage"
        ADD CONSTRAINT "SupportMessage_adminId_fkey"
        FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Helpful index for unread customer messages
CREATE INDEX IF NOT EXISTS "SupportMessage_unread_customer_idx" ON "SupportMessage"("userId")
  WHERE ("senderRole" = 'CUSTOMER' AND "readAt" IS NULL);
