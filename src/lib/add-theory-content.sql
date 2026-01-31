-- =============================================
-- 为课程添加理论内容
-- 在 Supabase SQL Editor 中运行此脚本
-- =============================================

-- 单音识别 I - 第1课：认识中央C
UPDATE lessons
SET content = content || '{"theory": {
  "title": "认识中央C",
  "content": "## 什么是中央C？\n\n中央C（C4）是钢琴键盘正中间的那个C音，是音乐学习的重要参考点。\n\n### 为什么叫\"中央C\"？\n\n- 位于钢琴88键的中央位置\n- 在五线谱上，刚好在高音谱号和低音谱号之间\n- MIDI 编号是 60，频率约 261.6Hz\n\n### 如何记住它的声音？\n\n中央C的音高不高不低，听起来非常\"中正\"。它是我们学习其他音符的基准参考点。",
  "audioExamples": [
    {"label": "中央C (C4)", "midi": 60},
    {"label": "低八度C (C3)", "midi": 48},
    {"label": "高八度C (C5)", "midi": 72}
  ],
  "keyPoints": [
    "中央C = C4 = MIDI 60",
    "位于钢琴键盘中间位置",
    "是音乐学习的基准参考音"
  ],
  "estimatedTime": 60
}}'::jsonb
WHERE id = 'single_note_1_l1';

-- 单音识别 I - 第2课：Do-Re-Mi
UPDATE lessons
SET content = content || '{"theory": {
  "title": "认识Do-Re-Mi",
  "content": "## Do-Re-Mi是什么？\n\n这是音乐中最基本的三个音符，它们构成了音阶的开始。\n\n### 音名与唱名\n\n- Do = C（哆）\n- Re = D（来）\n- Mi = E（咪）\n\n### 音程关系\n\n- Do到Re：大二度（2个半音）\n- Re到Mi：大二度（2个半音）\n- Do到Mi：大三度（4个半音）\n\n### 记忆技巧\n\nDo-Re-Mi就像电影《音乐之声》里唱的那样，是音乐的起点。",
  "audioExamples": [
    {"label": "Do (C4)", "midi": 60},
    {"label": "Re (D4)", "midi": 62},
    {"label": "Mi (E4)", "midi": 64}
  ],
  "keyPoints": [
    "Do-Re-Mi 对应 C-D-E",
    "Do到Re、Re到Mi都是大二度",
    "这三个音是音阶的起点"
  ],
  "estimatedTime": 60
}}'::jsonb
WHERE id = 'single_note_1_l2';

-- 单音识别 I - 第3课：Fa-Sol-La
UPDATE lessons
SET content = content || '{"theory": {
  "title": "认识Fa-Sol-La",
  "content": "## 继续探索音阶\n\n在学会了Do-Re-Mi之后，我们来认识接下来的三个音。\n\n### 音名与唱名\n\n- Fa = F（发）\n- Sol = G（索）\n- La = A（拉）\n\n### 音程特点\n\n- Mi到Fa：小二度（只有1个半音，听起来很近）\n- Fa到Sol：大二度（2个半音）\n- Sol到La：大二度（2个半音）\n\n### 小二度的特殊感觉\n\nMi到Fa只差半音，这是自然大调中最\"紧张\"的地方，听起来有种想要解决的感觉。",
  "audioExamples": [
    {"label": "Fa (F4)", "midi": 65},
    {"label": "Sol (G4)", "midi": 67},
    {"label": "La (A4)", "midi": 69}
  ],
  "keyPoints": [
    "Fa-Sol-La 对应 F-G-A",
    "Mi到Fa是小二度（半音）",
    "La是标准音A（440Hz）"
  ],
  "estimatedTime": 60
}}'::jsonb
WHERE id = 'single_note_1_l3';

-- 单音识别 I - 第4课：Ti与高音Do
UPDATE lessons
SET content = content || '{"theory": {
  "title": "完成音阶：Ti和高音Do",
  "content": "## 音阶的终点与新起点\n\n学完Ti（Si）和高音Do，你就掌握了完整的一个八度音阶！\n\n### 音名与唱名\n\n- Ti (Si) = B（西）\n- 高音Do = C5\n\n### 特殊的音程关系\n\n- La到Ti：大二度（2个半音）\n- Ti到高音Do：小二度（只有1个半音）\n\n### 导音的魔力\n\nTi（第七级音）被称为\"导音\"，它有强烈的倾向想要\"解决\"到Do。这就是为什么Ti到Do听起来特别\"完满\"。",
  "audioExamples": [
    {"label": "Ti (B4)", "midi": 71},
    {"label": "高音Do (C5)", "midi": 72},
    {"label": "完整音阶", "midi": 60}
  ],
  "keyPoints": [
    "Ti是导音，想要解决到Do",
    "Ti到Do是小二度（半音）",
    "一个八度包含12个半音"
  ],
  "estimatedTime": 60
}}'::jsonb
WHERE id = 'single_note_1_l4';

-- 音程基础 - 第1课：认识音程
UPDATE lessons
SET content = content || '{"theory": {
  "title": "什么是音程？",
  "content": "## 音程的定义\n\n音程是指两个音之间的距离。就像用尺子量长度一样，我们用\"度\"来衡量两个音的远近。\n\n### 最简单的两个音程\n\n- 纯一度：同一个音（距离为0）\n- 纯八度：相隔12个半音（高/低一个八度）\n\n### 如何听辨？\n\n- 纯一度：两个音完全一样，没有变化\n- 纯八度：听起来\"一样但不一样\"，一个高一个低\n\n### 有趣的现象\n\n纯八度的两个音虽然音高不同，但给人的感觉非常相似。这就是为什么我们把它们叫做相同的音名！",
  "audioExamples": [
    {"label": "纯一度：同音", "midi": 60, "secondMidi": 60},
    {"label": "纯八度：高八度", "midi": 60, "secondMidi": 72},
    {"label": "纯八度：低八度", "midi": 72, "secondMidi": 60}
  ],
  "keyPoints": [
    "音程 = 两个音之间的距离",
    "纯一度 = 同一个音",
    "纯八度 = 相隔12个半音"
  ],
  "estimatedTime": 90
}}'::jsonb
WHERE id = 'interval_basic_l1';

-- 音程基础 - 第2课：大二度与小二度
UPDATE lessons
SET content = content || '{"theory": {
  "title": "二度音程：大二度与小二度",
  "content": "## 最近的邻居\n\n二度是相邻两个音之间的关系，是最小的音程距离（不含一度）。\n\n### 两种二度\n\n- 小二度：1个半音（如 E-F, B-C）\n- 大二度：2个半音（如 C-D, D-E）\n\n### 听觉特点\n\n- 小二度听起来很\"紧张\"，有种不协和感\n- 大二度相对\"舒缓\"，常用于旋律进行\n\n### 记忆口诀\n\n- 小二度：像《大白鲨》主题曲的开头两个音\n- 大二度：像《两只老虎》的前两个音",
  "audioExamples": [
    {"label": "小二度：E-F", "midi": 64, "secondMidi": 65},
    {"label": "大二度：C-D", "midi": 60, "secondMidi": 62},
    {"label": "小二度：B-C", "midi": 71, "secondMidi": 72}
  ],
  "keyPoints": [
    "小二度 = 1个半音（听起来紧张）",
    "大二度 = 2个半音（听起来舒缓）",
    "自然音阶中E-F和B-C是小二度"
  ],
  "estimatedTime": 90
}}'::jsonb
WHERE id = 'interval_basic_l2';

-- 音程基础 - 第3课：大三度与小三度
UPDATE lessons
SET content = content || '{"theory": {
  "title": "三度音程：音乐的色彩",
  "content": "## 大调与小调的核心\n\n三度音程决定了音乐是\"明亮\"还是\"忧郁\"的基本色彩。\n\n### 两种三度\n\n- 小三度：3个半音，听起来\"暗淡、忧伤\"\n- 大三度：4个半音，听起来\"明亮、欢快\"\n\n### 和弦的基础\n\n- 大三和弦 = 根音 + 大三度 + 纯五度（明亮）\n- 小三和弦 = 根音 + 小三度 + 纯五度（忧伤）\n\n### 情感联想\n\n想象一首欢快的儿歌和一首伤感的情歌，它们的区别很大程度上来自三度的不同！",
  "audioExamples": [
    {"label": "小三度：忧伤的感觉", "midi": 60, "secondMidi": 63},
    {"label": "大三度：明亮的感觉", "midi": 60, "secondMidi": 64},
    {"label": "对比：小三 vs 大三", "midi": 60, "secondMidi": 63}
  ],
  "keyPoints": [
    "小三度 = 3个半音（忧伤色彩）",
    "大三度 = 4个半音（明亮色彩）",
    "三度决定和弦的大/小性质"
  ],
  "estimatedTime": 90
}}'::jsonb
WHERE id = 'interval_basic_l3';

-- 音程基础 - 第4课：纯四度与纯五度
UPDATE lessons
SET content = content || '{"theory": {
  "title": "完美的和谐：纯四度与纯五度",
  "content": "## 最和谐的音程\n\n纯四度和纯五度是音乐中最\"和谐\"的音程，被称为\"完全协和音程\"。\n\n### 纯四度与纯五度\n\n- 纯四度：5个半音（如 C-F）\n- 纯五度：7个半音（如 C-G）\n\n### 互补关系\n\n有趣的是，纯四度 + 纯五度 = 纯八度。它们是互补的关系！\n\n### 经典记忆法\n\n- 纯四度：《婚礼进行曲》的开头\n- 纯五度：《星球大战》主题的开头",
  "audioExamples": [
    {"label": "纯四度：C-F", "midi": 60, "secondMidi": 65},
    {"label": "纯五度：C-G", "midi": 60, "secondMidi": 67},
    {"label": "互补演示", "midi": 60, "secondMidi": 72}
  ],
  "keyPoints": [
    "纯四度 = 5个半音",
    "纯五度 = 7个半音",
    "纯四度 + 纯五度 = 纯八度"
  ],
  "estimatedTime": 90
}}'::jsonb
WHERE id = 'interval_basic_l4';

-- 验证更新结果
SELECT id, name, 
       CASE WHEN content->'theory' IS NOT NULL THEN '✓ 有理论' ELSE '✗ 无理论' END as theory_status
FROM lessons 
WHERE skill_id IN ('single_note_1', 'interval_basic')
ORDER BY skill_id, lesson_order;
