-- =============================================
-- 每日挑战分数表
-- 在 Supabase SQL Editor 中运行此脚本
-- =============================================

-- 创建每日挑战分数表
CREATE TABLE IF NOT EXISTS daily_challenge_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  challenge_type TEXT DEFAULT 'quiz',
  score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_daily_challenge_date ON daily_challenge_scores(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_user ON daily_challenge_scores(user_id);

-- RLS 策略
ALTER TABLE daily_challenge_scores ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的记录
DROP POLICY IF EXISTS "Users can view own daily challenge scores" ON daily_challenge_scores;
CREATE POLICY "Users can view own daily challenge scores" ON daily_challenge_scores
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以插入自己的记录
DROP POLICY IF EXISTS "Users can insert own daily challenge scores" ON daily_challenge_scores;
CREATE POLICY "Users can insert own daily challenge scores" ON daily_challenge_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的记录
DROP POLICY IF EXISTS "Users can update own daily challenge scores" ON daily_challenge_scores;
CREATE POLICY "Users can update own daily challenge scores" ON daily_challenge_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- 验证
SELECT 'daily_challenge_scores table created successfully' as status;
