-- ==========================================
-- 添加邮箱字段到 profiles 表
-- 版本: 1.0
-- 日期: 2026-02-04
-- ==========================================

-- 1. 添加 email 字段到 profiles 表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. 创建索引以加速邮箱搜索
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 3. 从 auth.users 同步现有用户的邮箱到 profiles
-- 注意：这需要在 Supabase Dashboard 的 SQL Editor 中以管理员身份运行
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 4. 更新 handle_new_user 触发器，保存邮箱
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'username',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username);
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql' SECURITY DEFINER;

-- 5. 确保触发器存在
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
