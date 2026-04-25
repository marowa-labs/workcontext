-- Check and fix RLS policies for pdf_documents table

-- Disable RLS on pdf_documents (backend should have full access)
ALTER TABLE public.pdf_documents DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, add policies
-- ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow backend full access to pdf_documents" 
--   ON public.pdf_documents 
--   FOR ALL 
--   TO authenticated, service_role
--   USING (true)
--   WITH CHECK (true);

-- Also disable RLS on documents table for backend operations
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- Check if the tables exist and have correct permissions
SELECT 
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('documents', 'pdf_documents');

SELECT 'RLS disabled on both tables' AS status;
