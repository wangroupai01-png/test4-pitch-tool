-- =============================================
-- 新用户引导系统数据库
-- =============================================

-- 1. 用户引导状态表
CREATE TABLE IF NOT EXISTS user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  ability_test_score INTEGER DEFAULT 0,          -- 能力测试得分 (0-5)
  ability_level TEXT DEFAULT 'beginner',         -- 'beginner', 'intermediate', 'advanced'
  recommended_skill TEXT DEFAULT 'single_note_1', -- 推荐起始技能
  daily_goal_minutes INTEGER DEFAULT 10,         -- 每日目标分钟数
  onboarding_step INTEGER DEFAULT 0,             -- 当前步骤 (0-4)
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 策略
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的引导状态
CREATE POLICY "Users can view own onboarding"
  ON user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能更新自己的引导状态
CREATE POLICY "Users can update own onboarding"
  ON user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户可以插入自己的引导状态
CREATE POLICY "Users can insert own onboarding"
  ON user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. 索引
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed 
  ON user_onboarding(onboarding_completed);

-- 4. 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_onboarding_updated_at ON user_onboarding;
CREATE TRIGGER trigger_update_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- 5. 函数：完成引导时自动设置完成时间
CREATE OR REPLACE FUNCTION complete_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE THEN
    NEW.onboarding_completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_complete_onboarding ON user_onboarding;
CREATE TRIGGER trigger_complete_onboarding
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION complete_onboarding();
