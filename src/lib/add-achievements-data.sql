-- =============================================
-- 成就系统数据初始化
-- 在 Supabase SQL Editor 中运行此脚本
-- =============================================

-- 先添加新字段 condition_type 和 condition_value（如果不存在）
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS condition_type TEXT;
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS condition_value INTEGER DEFAULT 1;

-- 删除旧的成就数据（如果有冲突）
DELETE FROM achievements WHERE id IN (
  'first_lesson', 'lessons_5', 'lessons_10', 'lessons_25',
  'first_skill', 'skills_3', 'skills_5',
  'streak_3', 'streak_7', 'streak_14', 'streak_30',
  'level_5', 'level_10', 'level_20',
  'xp_500', 'xp_2000', 'xp_5000'
);

-- 插入成就数据（包含 category 字段）
INSERT INTO achievements (id, name, description, category, icon, xp_reward, sort_order, condition_type, condition_value) VALUES
  -- 学习成就
  ('first_lesson', '开始旅程', '完成第一节课', 'learning', '🎵', 50, 1, 'lessons_completed', 1),
  ('lessons_5', '勤奋学员', '完成5节课程', 'learning', '📚', 100, 2, 'lessons_completed', 5),
  ('lessons_10', '学习达人', '完成10节课程', 'learning', '🎓', 200, 3, 'lessons_completed', 10),
  ('lessons_25', '课程收割机', '完成25节课程', 'learning', '🌟', 500, 4, 'lessons_completed', 25),
  
  -- 技能成就
  ('first_skill', '技能解锁', '完成第一个技能', 'learning', '🔓', 100, 5, 'skills_completed', 1),
  ('skills_3', '多面手', '完成3个技能', 'learning', '💪', 300, 6, 'skills_completed', 3),
  ('skills_5', '技能大师', '完成5个技能', 'learning', '👑', 500, 7, 'skills_completed', 5),
  
  -- 打卡成就
  ('streak_3', '三日坚持', '连续练习3天', 'streak', '🔥', 50, 10, 'streak_days', 3),
  ('streak_7', '周周向上', '连续练习7天', 'streak', '⭐', 150, 11, 'streak_days', 7),
  ('streak_14', '两周达人', '连续练习14天', 'streak', '🏆', 300, 12, 'streak_days', 14),
  ('streak_30', '月度传奇', '连续练习30天', 'streak', '💎', 1000, 13, 'streak_days', 30),
  
  -- 等级成就
  ('level_5', '初露锋芒', '达到5级', 'special', '⬆️', 100, 20, 'level', 5),
  ('level_10', '崭露头角', '达到10级', 'special', '📈', 250, 21, 'level', 10),
  ('level_20', '渐入佳境', '达到20级', 'special', '🚀', 500, 22, 'level', 20),
  
  -- XP 成就
  ('xp_500', '积少成多', '累计获得500 XP', 'special', '💰', 50, 30, 'total_xp', 500),
  ('xp_2000', '财富累积', '累计获得2000 XP', 'special', '💎', 200, 31, 'total_xp', 2000),
  ('xp_5000', 'XP 大亨', '累计获得5000 XP', 'special', '👑', 500, 32, 'total_xp', 5000)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  xp_reward = EXCLUDED.xp_reward,
  sort_order = EXCLUDED.sort_order,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value;

-- 验证插入结果
SELECT id, name, category, condition_type, condition_value, xp_reward FROM achievements ORDER BY sort_order;
