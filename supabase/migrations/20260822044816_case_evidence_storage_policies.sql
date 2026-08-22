/*
# Storage policies for case-evidence bucket

1. Security
- Authenticated users can upload, read, and delete files only in their own folder (user_id/...).
- Folder path prefix matches auth.uid() so users cannot access each other's evidence files.
*/

DROP POLICY IF EXISTS "evidence_upload_own" ON storage.objects;
CREATE POLICY "evidence_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'case-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "evidence_read_own" ON storage.objects;
CREATE POLICY "evidence_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'case-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "evidence_delete_own" ON storage.objects;
CREATE POLICY "evidence_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'case-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);