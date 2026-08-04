-- Migration: Add external_document_chunks table for chunk-level embeddings.
-- Run this against your production database before deploying the code changes.
-- Requires the pgvector extension (already enabled by setup_vector_store*.sql).

CREATE TABLE IF NOT EXISTS external_document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id   UUID NOT NULL REFERENCES external_tool_content(id) ON DELETE CASCADE,
  chunk_index  INT NOT NULL DEFAULT 0,
  chunk_text   TEXT NOT NULL,
  embedding    vector,
  dim          INT,
  indexed_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_external_document_chunks_content_id
  ON external_document_chunks (content_id);

CREATE INDEX IF NOT EXISTS idx_external_document_chunks_dim
  ON external_document_chunks (dim);

CREATE INDEX IF NOT EXISTS idx_external_document_chunks_indexed_at
  ON external_document_chunks (indexed_at);
