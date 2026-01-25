-- 添加单音识别 II 的课程（低音区和高音区）
INSERT INTO lessons (id, skill_id, name, description, lesson_order, lesson_type, xp_reward, content) VALUES
  ('single_note_2_l1', 'single_note_2', '低音区入门', '学习C3-B3低音区的音符', 1, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":48,"options":[48,50,52,53]},{"type":"identify","targetMidi":50,"options":[48,50,52,53]},{"type":"identify","targetMidi":52,"options":[48,50,52,53]},{"type":"identify","targetMidi":53,"options":[48,50,52,55]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l2', 'single_note_2', '低音区进阶', '继续学习低音区G3-B3', 2, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":55,"options":[53,55,57,59]},{"type":"identify","targetMidi":57,"options":[53,55,57,59]},{"type":"identify","targetMidi":59,"options":[53,55,57,59]},{"type":"identify","targetMidi":55,"options":[55,57,59]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l3', 'single_note_2', '高音区入门', '学习C5-E5高音区的音符', 3, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":72,"options":[72,74,76,77]},{"type":"identify","targetMidi":74,"options":[72,74,76,77]},{"type":"identify","targetMidi":76,"options":[72,74,76,77]},{"type":"identify","targetMidi":72,"options":[72,74,76]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l4', 'single_note_2', '高音区进阶', '继续学习高音区F5-B5', 4, 'quiz', 20,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":77,"options":[77,79,81,83]},{"type":"identify","targetMidi":79,"options":[77,79,81,83]},{"type":"identify","targetMidi":81,"options":[77,79,81,83]},{"type":"identify","targetMidi":83,"options":[77,79,81,83]}],"passThreshold":0.7}'::jsonb),
  
  ('single_note_2_l5', 'single_note_2', '全音域测验', '测试你对C3-C6全音域的掌握', 5, 'quiz', 30,
   '{"type":"quiz","questions":[{"type":"identify","targetMidi":48,"options":[48,60,72]},{"type":"identify","targetMidi":60,"options":[48,60,72]},{"type":"identify","targetMidi":72,"options":[48,60,72]},{"type":"identify","targetMidi":55,"options":[55,67,79]},{"type":"identify","targetMidi":67,"options":[55,67,79]},{"type":"identify","targetMidi":79,"options":[55,67,79]}],"passThreshold":0.8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  content = EXCLUDED.content;
