-- Step 1: Clean up any existing objects
DROP INDEX IF EXISTS documents_embedding_idx;
DROP FUNCTION IF EXISTS match_documents;
DROP TABLE IF EXISTS documents;

-- Step 2: Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- Step 3: Create the documents table (WITHOUT index for now)
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding vector(1536)
);

-- Step 4: Create the match_documents function
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

-- Success message
SELECT 'Vector store setup complete! Index will be added after first document upload.' AS status;
