-- Migration: Remove Academic Features
-- This migration removes citation and research-related tables
-- as part of the pivot from academic research tool to productivity workspace

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS "CitationActivity" CASCADE;
DROP TABLE IF EXISTS "Citation" CASCADE;
DROP TABLE IF EXISTS "SavedPaper" CASCADE;
DROP TABLE IF EXISTS "ResearchSource" CASCADE;
DROP TABLE IF EXISTS "ResearchTopic" CASCADE;
DROP TABLE IF EXISTS "ResearchAnalysis" CASCADE;
DROP TABLE IF EXISTS "ProjectSource" CASCADE;
DROP TABLE IF EXISTS "ResearchPaper" CASCADE;

-- Note: The following fields in existing tables should be removed in a future migration
-- or marked as deprecated:
-- - Project.citation_style
-- - Project.citations (relation)
-- - Project.citation_activities (relation)
-- - Project.sources (relation)
-- - User.citation_activities (relation)
-- - User.saved_papers (relation)
-- - User.researchSources (relation)
-- - User.researchTopics (relation)
-- - AIChatMessage.citations
-- - NotificationSettings.research_updates_*
-- - Template.citation_style
