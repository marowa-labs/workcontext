-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Create the documents table for vector storage
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding vector(1536)
);

-- Create a basic index first (no training data needed)
-- We'll use HNSW which doesn't require training data
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents USING hnsw (embedding vector_cosine_ops);

-- Alternative: Use ivfflat only after you have some data
-- To create ivfflat index later, run:
-- CREATE INDEX documents_embedding_idx ON documents 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create the match_documents function for similarity search
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    documents.embedding,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
