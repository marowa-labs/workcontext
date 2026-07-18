-- Unified context layer: store vector embeddings for workspace items so the app can
-- power semantic "Related Items" and cross-workspace RAG retrieval.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS context_embeddings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     text NOT NULL,
  workspace_id text,
  entity_type  text NOT NULL,
  entity_id    text NOT NULL,
  title        text,
  content      text,
  embedding    vector,
  dim          integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS context_embeddings_owner_idx
  ON context_embeddings (owner_id);

CREATE INDEX IF NOT EXISTS context_embeddings_workspace_idx
  ON context_embeddings (workspace_id);

CREATE INDEX IF NOT EXISTS context_embeddings_entity_idx
  ON context_embeddings (entity_type, entity_id);
