-- Add password reset code fields (non-destructive)

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "passwordResetCodeHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetCodeExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordResetCodeSentAt" TIMESTAMP(3);
