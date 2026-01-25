-- =============================================
-- Melody Challenger v2.0 - 数据库扩展 Schema
-- =============================================
-- 请在 Supabase Dashboard -> SQL Editor 中运行此脚本
-- 注意：需要先运行 supabase-schema.sql (v1.0)

-- =============================================
-- 1. 技能系统
-- =============================================

-- 技能定义表
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,                    -- 如 'single_note_1'
  name TEXT NOT NULL,                     -- '单音识别 I'
  description TEXT,
  category TEXT NOT NULL,                 -- 'basic', 'intermediate', 'advanced'
  icon TEXT,                              -- emoji图标
  sort_order INTEGER NOT NULL DEFAULT 0,
  prerequisite_skill_id TEXT REFERENCES skills(id), -- 前置技能
  xp_reward INTEGER DEFAULT 100,          -- 完成技能奖励XP
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程单元表
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,                    -- 如 'single_note_1_lesson_1'
  skill_id TEXT REFERENCES skills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- '认识中央C'
  description TEXT,
  lesson_order INTEGER NOT NULL,          -- 课程顺序
  lesson_type TEXT NOT NULL,              -- 'quiz', 'sing', 'listen', 'theory'
  content JSONB NOT NULL,                 -- 课程内容配置
  xp_reward INTEGER DEFAULT 20,           -- 完成课程奖励XP
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户技能进度表
CREATE TABLE IF NOT EXISTS user_skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT REFERENCES skills(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'locked',           -- 'locked', 'unlocked', 'in_progress', 'completed'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- 用户课程进度表
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'locked',           -- 'locked', 'unlocked', 'completed'
  best_score INTEGER DEFAULT 0,
  stars INTEGER DEFAULT 0,                -- 0-3星评级
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- =============================================
-- 2. XP 经验值系统
-- =============================================

-- 用户XP与等级表
CREATE TABLE IF NOT EXISTS user_xp (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_today INTEGER DEFAULT 0,             -- 今日获得XP
  last_xp_date DATE,                      -- 上次获得XP的日期
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP记录表（详细追踪）
CREATE TABLE IF NOT EXISTS xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,                   -- 'lesson', 'daily', 'streak', 'skill', 'achievement'
  source_id TEXT,                         -- 关联的课程/挑战ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 等级配置表
CREATE TABLE IF NOT EXISTS level_config (
  level INTEGER PRIMARY KEY,
  required_xp INTEGER NOT NULL,
  title TEXT NOT NULL,
  rewards JSONB                           -- 解锁奖励
);

-- 插入等级配置
INSERT INTO level_config (level, required_xp, title) VALUES
  (1, 0, '音乐新手'),
  (2, 100, '音乐新手'),
  (3, 250, '音乐新手'),
  (4, 450, '音乐新手'),
  (5, 700, '初学者'),
  (6, 1000, '初学者'),
  (7, 1350, '初学者'),
  (8, 1750, '初学者'),
  (9, 2200, '初学者'),
  (10, 2700, '音感学徒'),
  (11, 3250, '音感学徒'),
  (12, 3850, '音感学徒'),
  (13, 4500, '音感学徒'),
  (14, 5200, '音感学徒'),
  (15, 6000, '进阶学员'),
  (16, 6900, '进阶学员'),
  (17, 7900, '进阶学员'),
  (18, 9000, '进阶学员'),
  (19, 10200, '进阶学员'),
  (20, 11500, '音乐达人'),
  (25, 20000, '练耳高手'),
  (30, 35000, '音感大师'),
  (40, 60000, '绝对音感'),
  (50, 100000, '音乐之神')
ON CONFLICT (level) DO NOTHING;

-- =============================================
-- 3. 打卡与连续性追踪
-- =============================================

-- 用户打卡记录
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,       -- 当前连续天数
  longest_streak INTEGER DEFAULT 0,       -- 最长连续天数
  last_active_date DATE,                  -- 上次活跃日期
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. 成就系统
-- =============================================

-- 成就定义表
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,                    -- 如 'first_lesson'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,                 -- 'learning', 'practice', 'streak', 'compete', 'special'
  icon TEXT,
  xp_reward INTEGER DEFAULT 50,
  condition JSONB,                        -- 解锁条件配置
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户成就表
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 插入初始成就
INSERT INTO achievements (id, name, description, category, icon, xp_reward, sort_order) VALUES
  -- 学习成就
  ('first_lesson', '开始旅程', '完成第一节课', 'learning', '🎓', 50, 1),
  ('skill_1', '技能解锁', '完成第一个技能', 'learning', '⭐', 100, 2),
  ('skill_5', '五星学员', '完成5个技能', 'learning', '🌟', 200, 3),
  ('all_basic', '基础毕业', '完成基础篇所有技能', 'learning', '📗', 500, 4),
  
  -- 练习成就
  ('streak_5', '小有成就', '单局连击5次', 'practice', '🔥', 30, 10),
  ('streak_10', '耳朵灵敏', '单局连击10次', 'practice', '👂', 50, 11),
  ('streak_20', '音感达人', '单局连击20次', 'practice', '🎯', 100, 12),
  ('perfect_10', '完美表现', '10题全对', 'practice', '💯', 80, 13),
  
  -- 坚持成就
  ('daily_3', '初露锋芒', '连续3天练习', 'streak', '📅', 30, 20),
  ('daily_7', '周周向上', '连续7天练习', 'streak', '🗓️', 100, 21),
  ('daily_30', '月度达人', '连续30天练习', 'streak', '📆', 500, 22),
  ('daily_100', '百日坚持', '连续100天练习', 'streak', '🏅', 2000, 23),
  
  -- 竞技成就
  ('daily_top10', '今日之星', '每日挑战前10名', 'compete', '⭐', 50, 30),
  ('daily_champion', '日冠军', '每日挑战第1名', 'compete', '👑', 200, 31)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. 索引优化
-- =============================================

CREATE INDEX IF NOT EXISTS idx_lessons_skill_id ON lessons(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user ON xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created ON xp_logs(created_at);

-- =============================================
-- 6. RLS 策略
-- =============================================

-- 启用 RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- skills 和 lessons: 所有人可读
CREATE POLICY "Skills are viewable by everyone" ON skills FOR SELECT USING (true);
CREATE POLICY "Lessons are viewable by everyone" ON lessons FOR SELECT USING (true);
CREATE POLICY "Level config is viewable by everyone" ON level_config FOR SELECT USING (true);
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- 用户自己的数据
CREATE POLICY "Users can view own skill progress" ON user_skill_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skill progress" ON user_skill_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skill progress" ON user_skill_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own lesson progress" ON user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON user_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON user_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own xp" ON user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp" ON user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp" ON user_xp FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own xp logs" ON xp_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp logs" ON xp_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. 初始技能和课程数据
-- =============================================

-- 插入基础技能
INSERT INTO skills (id, name, description, category, icon, sort_order, xp_reward) VALUES
  ('single_note_1', '单音识别 I', '学习识别基础音符 Do-Re-Mi-Fa-Sol-La-Ti', 'basic', '🎯', 1, 100),
  ('single_note_2', '单音识别 II', '扩展音域，学习低音区和高音区', 'basic', '🎯', 2, 100),
  ('pitch_basic', '音准入门', '学习跟唱单音，保持稳定音准', 'basic', '🎤', 3, 100),
  ('interval_basic', '音程基础', '认识并区分基础音程', 'basic', '🎵', 4, 150)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 设置前置技能
UPDATE skills SET prerequisite_skill_id = 'single_note_1' WHERE id = 'single_note_2';
UPDATE skills SET prerequisite_skill_id = 'single_note_1' WHERE id = 'pitch_basic';
UPDATE skills SET prerequisite_skill_id = 'single_note_2' WHERE id = 'interval_basic';

-- 插入课程
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, xp_reward, content) VALUES
  -- 单音识别 I 的课程
  ('single_note_1_l1', 'single_note_1', '认识中央C', '学习钢琴中央C的声音', 1, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":60,"options":[60,62,64,65]},{"type":"identify","targetMidi":60,"options":[59,60,61,62]},{"type":"identify","targetMidi":60,"options":[58,60,62,64]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_1_l2', 'single_note_1', 'Do-Re-Mi', '学习C-D-E三个音', 2, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":60,"options":[60,62,64,65]},{"type":"identify","targetMidi":62,"options":[60,62,64,65]},{"type":"identify","targetMidi":64,"options":[60,62,64,65]},{"type":"identify","targetMidi":60,"options":[60,62,64]},{"type":"identify","targetMidi":62,"options":[60,62,64]},{"type":"identify","targetMidi":64,"options":[60,62,64]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_1_l3', 'single_note_1', 'Fa-Sol-La', '学习F-G-A三个音', 3, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":65,"options":[64,65,67,69]},{"type":"identify","targetMidi":67,"options":[64,65,67,69]},{"type":"identify","targetMidi":69,"options":[64,65,67,69]},{"type":"identify","targetMidi":65,"options":[65,67,69]},{"type":"identify","targetMidi":67,"options":[65,67,69]},{"type":"identify","targetMidi":69,"options":[65,67,69]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_1_l4', 'single_note_1', 'Ti与高音Do', '学习B和高音C', 4, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":71,"options":[69,71,72,74]},{"type":"identify","targetMidi":72,"options":[69,71,72,74]},{"type":"identify","targetMidi":71,"options":[71,72]},{"type":"identify","targetMidi":72,"options":[71,72]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_1_l5', 'single_note_1', '综合测验', '测试你对C4-C5所有音符的掌握', 5, 'quiz', 30,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":60,"options":[60,62,64,65,67,69,71,72]},{"type":"identify","targetMidi":62,"options":[60,62,64,65,67,69,71,72]},{"type":"identify","targetMidi":64,"options":[60,62,64,65,67,69,71,72]},{"type":"identify","targetMidi":65,"options":[60,62,64,65,67,69,71,72]},{"type":"identify","targetMidi":67,"options":[60,62,64,65,67,69,71,72]},{"type":"identify","targetMidi":69,"options":[60,62,64,65,67,69,71,72]},{"type":"identify","targetMidi":71,"options":[60,62,64,65,67,69,71,72]},{"type":"identify","targetMidi":72,"options":[60,62,64,65,67,69,71,72]}],"passThreshold":0.8}'::jsonb),

  -- 单音识别 II 的课程（低音区和高音区）
  ('single_note_2_l1', 'single_note_2', '低音区入门', '学习C3-B3低音区的音符', 1, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":48,"options":[48,50,52,53]},{"type":"identify","targetMidi":50,"options":[48,50,52,53]},{"type":"identify","targetMidi":52,"options":[48,50,52,53]},{"type":"identify","targetMidi":53,"options":[48,50,52,55]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l2', 'single_note_2', '低音区进阶', '继续学习低音区G3-B3', 2, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":55,"options":[53,55,57,59]},{"type":"identify","targetMidi":57,"options":[53,55,57,59]},{"type":"identify","targetMidi":59,"options":[53,55,57,59]},{"type":"identify","targetMidi":55,"options":[55,57,59]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l3', 'single_note_2', '高音区入门', '学习C5-E5高音区的音符', 3, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":72,"options":[72,74,76,77]},{"type":"identify","targetMidi":74,"options":[72,74,76,77]},{"type":"identify","targetMidi":76,"options":[72,74,76,77]},{"type":"identify","targetMidi":72,"options":[72,74,76]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l4', 'single_note_2', '高音区进阶', '继续学习高音区F5-B5', 4, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":77,"options":[77,79,81,83]},{"type":"identify","targetMidi":79,"options":[77,79,81,83]},{"type":"identify","targetMidi":81,"options":[77,79,81,83]},{"type":"identify","targetMidi":83,"options":[77,79,81,83]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l5', 'single_note_2', '全音域测验', '测试你对C3-C6全音域的掌握', 5, 'quiz', 30,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":48,"options":[48,60,72]},{"type":"identify","targetMidi":60,"options":[48,60,72]},{"type":"identify","targetMidi":72,"options":[48,60,72]},{"type":"identify","targetMidi":55,"options":[55,67,79]},{"type":"identify","targetMidi":67,"options":[55,67,79]},{"type":"identify","targetMidi":79,"options":[55,67,79]}],"passThreshold":0.8}'::jsonb),

  -- 音准入门的课程
  ('pitch_basic_l1', 'pitch_basic', '找到你的音域', '测试你的舒适音域范围', 1, 'sing', 20,
   '{"type":"sing","questions":[{"type":"hold","targetMidi":60,"duration":2000},{"type":"hold","targetMidi":55,"duration":2000},{"type":"hold","targetMidi":65,"duration":2000}],"passThreshold":0.6}'::jsonb),
  
  ('pitch_basic_l2', 'pitch_basic', '跟唱单音', '听到音符后准确哼唱出来', 2, 'sing', 20,
   '{"type":"sing","questions":[{"type":"hold","targetMidi":60,"duration":1500},{"type":"hold","targetMidi":62,"duration":1500},{"type":"hold","targetMidi":64,"duration":1500},{"type":"hold","targetMidi":65,"duration":1500}],"passThreshold":0.7}'::jsonb),
  
  ('pitch_basic_l3', 'pitch_basic', '保持稳定', '延长哼唱时间，保持音准稳定', 3, 'sing', 25,
   '{"type":"sing","questions":[{"type":"hold","targetMidi":60,"duration":3000},{"type":"hold","targetMidi":64,"duration":3000},{"type":"hold","targetMidi":67,"duration":3000}],"passThreshold":0.7}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  content = EXCLUDED.content;

-- =============================================
-- 完成！
-- =============================================
