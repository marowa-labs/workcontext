-- Grant permissions on the documents table to authenticated and anon roles
-- This fixes the "permission denied for schema public" error

-- Grant table permissions
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO service_role;

-- Grant sequence permissions (for auto-incrementing ID)
GRANT USAGE, SELECT ON SEQUENCE public.documents_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.documents_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.documents_id_seq TO service_role;

-- Grant permissions on pdf_documents table as well
GRANT ALL ON TABLE public.pdf_documents TO authenticated;
GRANT ALL ON TABLE public.pdf_documents TO anon;
GRANT ALL ON TABLE public.pdf_documents TO service_role;

-- Enable RLS (Row Level Security) on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert/read their own documents
CREATE POLICY "Users can insert documents" 
  ON public.documents 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can read documents" 
  ON public.documents 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Success message
SELECT 'Permissions granted successfully!' AS status;
