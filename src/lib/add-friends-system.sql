-- ==========================================
-- 好友系统数据库架构
-- 版本: 1.0
-- 日期: 2026-01-28
-- ==========================================

-- 1. 好友关系表
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',     -- 'pending', 'accepted', 'rejected', 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)                -- 不能添加自己为好友
);

-- 2. 好友 PK 挑战表
CREATE TABLE IF NOT EXISTS friend_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL DEFAULT 'quiz', -- 'quiz', 'sing'
  difficulty TEXT DEFAULT 'normal',            -- 'easy', 'normal', 'hard'
  status TEXT NOT NULL DEFAULT 'pending',      -- 'pending', 'accepted', 'in_progress', 'completed', 'expired', 'declined'
  challenger_score INTEGER,                    -- 发起者得分
  opponent_score INTEGER,                      -- 被挑战者得分
  winner_id UUID REFERENCES auth.users(id),    -- 获胜者
  questions JSONB,                             -- 题目配置（双方做同样的题）
  expires_at TIMESTAMPTZ,                      -- 过期时间（24小时）
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 好友消息/通知表（可选，用于通知）
CREATE TABLE IF NOT EXISTS friend_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                          -- 'friend_request', 'friend_accepted', 'challenge_received', 'challenge_result'
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content JSONB,                               -- 通知内容
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON friend_challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_opponent ON friend_challenges(opponent_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON friend_challenges(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON friend_notifications(user_id, is_read);

-- 5. RLS 策略
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_notifications ENABLE ROW LEVEL SECURITY;

-- 好友关系：双方可读，发起者可写
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friend requests" ON friendships;
CREATE POLICY "Users can create friend requests" ON friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
CREATE POLICY "Users can update own friendships" ON friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;
CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- PK 挑战：双方可读写
DROP POLICY IF EXISTS "Users can view own challenges" ON friend_challenges;
CREATE POLICY "Users can view own challenges" ON friend_challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

DROP POLICY IF EXISTS "Users can create challenges" ON friend_challenges;
CREATE POLICY "Users can create challenges" ON friend_challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);

DROP POLICY IF EXISTS "Users can update own challenges" ON friend_challenges;
CREATE POLICY "Users can update own challenges" ON friend_challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- 通知：自己可读写
DROP POLICY IF EXISTS "Users can view own notifications" ON friend_notifications;
CREATE POLICY "Users can view own notifications" ON friend_notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON friend_notifications;
CREATE POLICY "Users can update own notifications" ON friend_notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create notifications" ON friend_notifications;
CREATE POLICY "Anyone can create notifications" ON friend_notifications
  FOR INSERT WITH CHECK (true);

-- 6. 触发器：更新 friendships.updated_at
CREATE OR REPLACE FUNCTION update_friendship_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS friendship_updated_at ON friendships;
CREATE TRIGGER friendship_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendship_timestamp();

-- 7. 辅助函数：检查两个用户是否是好友
CREATE OR REPLACE FUNCTION are_friends(p_user1 UUID, p_user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND ((user_id = p_user1 AND friend_id = p_user2) OR (user_id = p_user2 AND friend_id = p_user1))
  );
END;
$$ LANGUAGE plpgsql;

-- 8. 辅助函数：获取好友数量
CREATE OR REPLACE FUNCTION get_friend_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM friendships
  WHERE status = 'accepted'
  AND (user_id = p_user_id OR friend_id = p_user_id);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
