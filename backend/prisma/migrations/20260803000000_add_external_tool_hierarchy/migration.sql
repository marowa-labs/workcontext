-- Add hierarchy support columns to external_tool_content table

-- parent_id: FK to parent ExternalToolContent (null = root node)
ALTER TABLE "external_tool_content" ADD COLUMN IF NOT EXISTS "parent_id" TEXT;

-- depth: 0 = root, 1 = child, 2 = grandchild
ALTER TABLE "external_tool_content" ADD COLUMN IF NOT EXISTS "depth" INTEGER NOT NULL DEFAULT 0;

-- item_count: Number of direct children (for folder/repo nodes)
ALTER TABLE "external_tool_content" ADD COLUMN IF NOT EXISTS "item_count" INTEGER NOT NULL DEFAULT 0;

-- sort_order: Display order within parent
ALTER TABLE "external_tool_content" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

-- Add foreign key constraint for parent_id
ALTER TABLE "external_tool_content" ADD CONSTRAINT "external_tool_content_parent_id_fkey" 
  FOREIGN KEY ("parent_id") REFERENCES "external_tool_content"("id") ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS "external_tool_content_parent_id_idx" ON "external_tool_content"("parent_id");
CREATE INDEX IF NOT EXISTS "external_tool_content_depth_idx" ON "external_tool_content"("depth");
