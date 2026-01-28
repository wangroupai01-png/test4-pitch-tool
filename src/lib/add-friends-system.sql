-- =============================================
-- Melody Challenger - 好友系统数据库架构
-- =============================================
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本

-- 1. 好友关系表
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- 确保不能添加自己为好友
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
  -- 每对用户只能有一条记录
  UNIQUE(user_id, friend_id)
);

-- 2. 好友PK记录表
CREATE TABLE IF NOT EXISTS friend_pk_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_mode TEXT NOT NULL CHECK (game_mode IN ('quiz', 'sing')),
  challenger_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'expired')),
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 3. PK历史统计表
CREATE TABLE IF NOT EXISTS pk_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  current_win_streak INTEGER DEFAULT 0,
  best_win_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_pk_matches_challenger ON friend_pk_matches(challenger_id);
CREATE INDEX IF NOT EXISTS idx_pk_matches_opponent ON friend_pk_matches(opponent_id);
CREATE INDEX IF NOT EXISTS idx_pk_matches_status ON friend_pk_matches(status);

-- 5. 启用 RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_pk_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pk_stats ENABLE ROW LEVEL SECURITY;

-- 6. friendships 表策略
-- 用户可以查看自己相关的好友关系
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 用户可以发送好友请求
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己相关的好友关系（接受/拒绝/屏蔽）
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 用户可以删除自己发起的好友关系
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 7. friend_pk_matches 表策略
CREATE POLICY "Users can view own pk matches"
  ON friend_pk_matches FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create pk challenges"
  ON friend_pk_matches FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update own pk matches"
  ON friend_pk_matches FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- 8. pk_stats 表策略
CREATE POLICY "PK stats are viewable by everyone"
  ON pk_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own pk stats"
  ON pk_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pk stats"
  ON pk_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. 触发器: 自动更新 updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pk_stats_updated_at
  BEFORE UPDATE ON pk_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. 搜索用户的函数（根据用户名或邮箱模糊搜索）
CREATE OR REPLACE FUNCTION search_users(search_term TEXT, current_user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  avatar_url TEXT,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    COALESCE(ux.current_level, 1) as level
  FROM profiles p
  LEFT JOIN user_xp ux ON p.id = ux.user_id
  WHERE 
    p.id != current_user_id
    AND (
      p.username ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1 FROM auth.users au 
        WHERE au.id = p.id 
        AND au.email ILIKE '%' || search_term || '%'
      )
    )
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 获取好友列表的函数
CREATE OR REPLACE FUNCTION get_friends_list(current_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  username TEXT,
  avatar_url TEXT,
  level INTEGER,
  friendship_status TEXT,
  is_requester BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id = current_user_id THEN f.friend_id 
      ELSE f.user_id 
    END as friend_id,
    p.username,
    p.avatar_url,
    COALESCE(ux.current_level, 1) as level,
    f.status as friendship_status,
    (f.user_id = current_user_id) as is_requester
  FROM friendships f
  JOIN profiles p ON p.id = CASE 
    WHEN f.user_id = current_user_id THEN f.friend_id 
    ELSE f.user_id 
  END
  LEFT JOIN user_xp ux ON ux.user_id = p.id
  WHERE (f.user_id = current_user_id OR f.friend_id = current_user_id)
  ORDER BY f.status, p.username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
