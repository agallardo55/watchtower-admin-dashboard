-- Create storage bucket for app icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-icons', 'app-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload icons
CREATE POLICY "Authenticated users can upload app icons"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'app-icons');

-- Allow authenticated users to update/replace icons
CREATE POLICY "Authenticated users can update app icons"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-icons');

-- Allow authenticated users to delete icons
CREATE POLICY "Authenticated users can delete app icons"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-icons');

-- Public read access (bucket is public)
CREATE POLICY "Anyone can view app icons"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-icons');
