-- Create CollaborationLog and Comment tables (non-destructive).

-- CollaborationLog table
CREATE TABLE IF NOT EXISTS "CollaborationLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "targetSection" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "CollaborationLog_pkey" PRIMARY KEY ("id")
);

-- Comment table
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "section_id" TEXT,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parent_comment_id" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- Indexes for CollaborationLog
CREATE INDEX IF NOT EXISTS "CollaborationLog_sessionId_idx" ON "CollaborationLog"("sessionId");
CREATE INDEX IF NOT EXISTS "CollaborationLog_projectId_idx" ON "CollaborationLog"("projectId");
CREATE INDEX IF NOT EXISTS "CollaborationLog_userId_idx" ON "CollaborationLog"("userId");
CREATE INDEX IF NOT EXISTS "CollaborationLog_eventType_idx" ON "CollaborationLog"("eventType");
CREATE INDEX IF NOT EXISTS "CollaborationLog_timestamp_idx" ON "CollaborationLog"("timestamp");

-- Indexes for Comment
CREATE INDEX IF NOT EXISTS "Comment_project_id_idx" ON "Comment"("project_id");
CREATE INDEX IF NOT EXISTS "Comment_section_id_idx" ON "Comment"("section_id");
CREATE INDEX IF NOT EXISTS "Comment_user_id_idx" ON "Comment"("user_id");
CREATE INDEX IF NOT EXISTS "Comment_parent_comment_id_idx" ON "Comment"("parent_comment_id");

-- Foreign keys for CollaborationLog
ALTER TABLE "CollaborationLog" ADD CONSTRAINT "CollaborationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CollaborationLog" ADD CONSTRAINT "CollaborationLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign keys for Comment
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;