-- Backfill existing NULLs before enforcing NOT NULL constraints
UPDATE "User" SET "name" = '' WHERE "name" IS NULL;
UPDATE "User" SET "phone" = '' WHERE "phone" IS NULL;
