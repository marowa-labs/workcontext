-- Add context_text and status columns to Comment table (non-destructive)

ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "context_text" TEXT;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
