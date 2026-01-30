-- =============================================
-- Melody Challenger - Storage 配置
-- =============================================
-- 注意: bucket 需要在 Supabase Dashboard 中手动创建
-- 1. 打开 Storage 页面
-- 2. 创建名为 "avatars" 的 public bucket

-- Storage RLS 策略 (如果 bucket 已创建)

-- 允许已登录用户上传头像
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 允许已登录用户更新自己的头像
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许已登录用户删除自己的头像
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许所有人查看头像 (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
