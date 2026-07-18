-- Sync schema drift (NON-DESTRUCTIVE).
--
-- The live database is behind the Prisma schema. This migration adds the missing
-- columns/tables and aligns `context_embeddings` to the schema.
--
-- Deliberately EXCLUDED: DROP COLUMN for legacy "academic" columns still present
-- in the DB (AIChatMessage.citations/sources, DocumentTemplate.citation_style,
-- NotificationSettings.research_updates_*). Those are simply no longer referenced
-- by the schema; dropping them would destroy data, so they are left in place.

-- AIUsage: new per-feature usage counters
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "byok_cost_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "byok_request_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "document_qa_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "grammar_check_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "summarization_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "system_cost_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "system_request_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AIUsage" ADD COLUMN IF NOT EXISTS "writing_project_count" INTEGER NOT NULL DEFAULT 0;

-- NotificationSettings: collaboration comments resolved flag
ALTER TABLE "NotificationSettings" ADD COLUMN IF NOT EXISTS "collaboration_comments_resolved" BOOLEAN NOT NULL DEFAULT true;

-- Project: make citation_style optional with a default
ALTER TABLE "Project" ALTER COLUMN "citation_style" DROP NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "citation_style" SET DEFAULT 'apa';

-- User: bring-your-own-key (BYOK) fields + flag
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_claude_key_encrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_claude_models" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_google_key_encrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_google_models" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_key_version" INTEGER DEFAULT 1;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_openai_key_encrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_openai_models" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_openrouter_key_encrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_openrouter_models" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "byok_provider" TEXT;

-- context_embeddings: align column types with the Prisma schema
-- (id: uuid -> text, content: nullable -> not null, timestamps: timestamptz -> timestamp(3))
ALTER TABLE "context_embeddings" DROP CONSTRAINT IF EXISTS "context_embeddings_pkey";
ALTER TABLE "context_embeddings" ALTER COLUMN "id" SET DATA TYPE TEXT;
ALTER TABLE "context_embeddings" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "context_embeddings" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "context_embeddings" ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "context_embeddings" ADD CONSTRAINT "context_embeddings_pkey" PRIMARY KEY ("id");

-- AIAction table
CREATE TABLE IF NOT EXISTS "AIAction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "user_intent" TEXT NOT NULL,
    "parsed_params" JSONB,
    "target_entity" TEXT,
    "target_id" TEXT,
    "confirmation_required" BOOLEAN NOT NULL DEFAULT true,
    "confirmed_at" TIMESTAMP(3),
    "confirmed_by" TEXT,
    "executed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "result_data" JSONB,
    "rollback_data" JSONB,
    "is_rolled_back" BOOLEAN NOT NULL DEFAULT false,
    "rolled_back_at" TIMESTAMP(3),
    "execution_duration_ms" INTEGER,
    "ai_model_used" TEXT,
    "tokens_used" INTEGER,
    "cost_estimate" DOUBLE PRECISION,
    "page_context" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIAction_pkey" PRIMARY KEY ("id")
);

-- PinnedComment table
CREATE TABLE IF NOT EXISTS "PinnedComment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "attachment_id" TEXT NOT NULL,
    "selected_text" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PinnedComment_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "AIAction_user_id_idx" ON "AIAction"("user_id");
CREATE INDEX IF NOT EXISTS "AIAction_action_type_idx" ON "AIAction"("action_type");
CREATE INDEX IF NOT EXISTS "AIAction_status_idx" ON "AIAction"("status");
CREATE INDEX IF NOT EXISTS "AIAction_target_entity_idx" ON "AIAction"("target_entity");
CREATE INDEX IF NOT EXISTS "AIAction_target_id_idx" ON "AIAction"("target_id");
CREATE INDEX IF NOT EXISTS "AIAction_created_at_idx" ON "AIAction"("created_at");
CREATE INDEX IF NOT EXISTS "AIAction_session_id_idx" ON "AIAction"("session_id");
CREATE INDEX IF NOT EXISTS "PinnedComment_user_id_idx" ON "PinnedComment"("user_id");
CREATE INDEX IF NOT EXISTS "PinnedComment_attachment_id_idx" ON "PinnedComment"("attachment_id");
CREATE INDEX IF NOT EXISTS "PinnedComment_user_id_attachment_id_idx" ON "PinnedComment"("user_id", "attachment_id");

-- Foreign keys
ALTER TABLE "AIAction" ADD CONSTRAINT "AIAction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PinnedComment" ADD CONSTRAINT "PinnedComment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename legacy context_embeddings indexes to match Prisma-generated names
ALTER INDEX IF EXISTS "context_embeddings_entity_idx" RENAME TO "context_embeddings_entity_type_entity_id_idx";
ALTER INDEX IF EXISTS "context_embeddings_owner_idx" RENAME TO "context_embeddings_owner_id_idx";
ALTER INDEX IF EXISTS "context_embeddings_workspace_idx" RENAME TO "context_embeddings_workspace_id_idx";
