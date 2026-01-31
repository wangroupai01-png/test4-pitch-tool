/**
 * 答题反馈数据：学习提示、记忆口诀等
 */

// ============ 音程记忆口诀 ============
export const INTERVAL_MNEMONICS: Record<string, string> = {
  // 小二度 (1个半音)
  '小二度': '《大白鲨》主题开头的两个音，紧张刺耳',
  'm2': '《大白鲨》主题开头的两个音，紧张刺耳',
  
  // 大二度 (2个半音)
  '大二度': '《两只老虎》开头"两只-"两个音',
  'M2': '《两只老虎》开头"两只-"两个音',
  
  // 小三度 (3个半音)
  '小三度': '有种淡淡的忧伤感，像《月亮代表我的心》开头',
  'm3': '有种淡淡的忧伤感，像《月亮代表我的心》开头',
  
  // 大三度 (4个半音)
  '大三度': '明亮开朗！《小星星》开头"一闪-"',
  'M3': '明亮开朗！《小星星》开头"一闪-"',
  
  // 纯四度 (5个半音)
  '纯四度': '《婚礼进行曲》开头，庄严感',
  'P4': '《婚礼进行曲》开头，庄严感',
  
  // 三全音 (6个半音)
  '三全音': '最不和谐的音程，中世纪称"魔鬼音程"',
  'TT': '最不和谐的音程，中世纪称"魔鬼音程"',
  
  // 纯五度 (7个半音)
  '纯五度': '《星球大战》主题开头，空旷宏大',
  'P5': '《星球大战》主题开头，空旷宏大',
  
  // 小六度 (8个半音)
  '小六度': '《爱情故事》开头，浪漫忧伤',
  'm6': '《爱情故事》开头，浪漫忧伤',
  
  // 大六度 (9个半音)
  '大六度': '《我的太阳》开头"O sole-"',
  'M6': '《我的太阳》开头"O sole-"',
  
  // 小七度 (10个半音)
  '小七度': '《西区故事》"Somewhere"开头',
  'm7': '《西区故事》"Somewhere"开头',
  
  // 大七度 (11个半音)
  '大七度': '紧张感强，接近但未到八度',
  'M7': '紧张感强，接近但未到八度',
  
  // 纯八度 (12个半音)
  '纯八度': '《彩虹之上》开头"Somewhere-over"',
  'P8': '《彩虹之上》开头"Somewhere-over"',
};

// ============ 和弦特征描述 ============
export const CHORD_CHARACTERISTICS: Record<string, string> = {
  // 三和弦
  'major': '明亮、开朗、稳定，像阳光普照',
  '大三和弦': '明亮、开朗、稳定，像阳光普照',
  
  'minor': '柔和、忧郁、内敛，像月光下的思念',
  '小三和弦': '柔和、忧郁、内敛，像月光下的思念',
  
  'dim': '紧张、不安、压抑，像悬疑电影配乐',
  '减三和弦': '紧张、不安、压抑，像悬疑电影配乐',
  
  'aug': '神秘、梦幻、不稳定，像童话的魔法时刻',
  '增三和弦': '神秘、梦幻、不稳定，像童话的魔法时刻',
  
  // 七和弦
  'maj7': '甜美、爵士感、温暖舒适',
  '大七和弦': '甜美、爵士感、温暖舒适',
  
  'min7': '柔和忧郁中带点温暖',
  '小七和弦': '柔和忧郁中带点温暖',
  
  'dom7': '有推动力，想要解决到下一个和弦',
  '属七和弦': '有推动力，想要解决到下一个和弦',
  
  'dim7': '极度紧张，常用于戏剧性转折',
  '减七和弦': '极度紧张，常用于戏剧性转折',
  
  'm7b5': '忧郁中带着不安定感',
  '半减七和弦': '忧郁中带着不安定感',
};

// ============ 音符学习提示 ============
export const NOTE_TIPS: Record<number, string> = {
  // C 音
  48: 'C3 是低音区的 C，浑厚低沉',
  60: 'C4 是中央 C，钢琴键盘正中间，是学习的基准音',
  72: 'C5 是高音区的 C，明亮清脆',
  
  // D 音
  50: 'D3 比 C3 高一个全音',
  62: 'D4 比中央 C 高一个全音，是"Re"',
  74: 'D5 是高音区的 Re',
  
  // E 音
  52: 'E3 是低音区的 Mi',
  64: 'E4 是中音区的 Mi，比 D4 高一个全音',
  76: 'E5 是高音区的 Mi',
  
  // F 音
  53: 'F3 是低音区的 Fa',
  65: 'F4 是中音区的 Fa，比 E4 只高半音！',
  77: 'F5 是高音区的 Fa',
  
  // G 音
  55: 'G3 是低音区的 Sol',
  67: 'G4 是中音区的 Sol，纯五度高于中央 C',
  79: 'G5 是高音区的 Sol',
  
  // A 音
  57: 'A3 是低音区的 La',
  69: 'A4 是标准音，440Hz，乐队调音基准！',
  81: 'A5 是高音区的 La',
  
  // B 音
  59: 'B3 是低音区的 Ti',
  71: 'B4 是中音区的 Ti，比 C5 只低半音',
  83: 'B5 是高音区的 Ti',
};

// ============ 通用音符比较提示 ============
export function getNoteComparisonTip(userMidi: number, correctMidi: number): string {
  const diff = correctMidi - userMidi;
  
  if (diff === 0) return '';
  
  const direction = diff > 0 ? '低' : '高';
  const absDiff = Math.abs(diff);
  
  if (absDiff === 1) {
    return `只差半个音！正确答案比你选的${direction}半音`;
  } else if (absDiff === 2) {
    return `正确答案比你选的${direction}一个全音`;
  } else if (absDiff <= 4) {
    return `正确答案比你选的${direction} ${absDiff} 个半音`;
  } else if (absDiff === 12) {
    return `你选对了音名，但八度${diff > 0 ? '低' : '高'}了`;
  } else {
    return `正确答案${diff > 0 ? '更高' : '更低'}，仔细听听音高差异`;
  }
}

// ============ 鼓励语 ============
export const CORRECT_ENCOURAGEMENTS = [
  '太棒了！🎉',
  '完美！✨',
  '你的耳朵真灵！👂',
  '正确！继续保持！💪',
  'Excellent! 🌟',
  '没错！你越来越厉害了！🚀',
];

export const WRONG_ENCOURAGEMENTS = [
  '别灰心，再试试！',
  '差一点点，继续加油！',
  '学习就是不断进步的过程',
  '没关系，记住这个音',
  '听一听正确答案，加深印象',
];

export function getRandomEncouragement(isCorrect: boolean): string {
  const list = isCorrect ? CORRECT_ENCOURAGEMENTS : WRONG_ENCOURAGEMENTS;
  return list[Math.floor(Math.random() * list.length)];
}

// ============ 获取完整的反馈信息 ============
export interface FeedbackInfo {
  isCorrect: boolean;
  title: string;
  userAnswer: string;
  correctAnswer: string;
  tip?: string;
  mnemonic?: string;
  characteristic?: string;
}

export function getFeedbackInfo(
  questionType: string,
  isCorrect: boolean,
  userAnswer: string | number,
  correctAnswer: string | number,
  extraData?: {
    intervalName?: string;
    chordType?: string;
    userMidi?: number;
    correctMidi?: number;
  }
): FeedbackInfo {
  const info: FeedbackInfo = {
    isCorrect,
    title: getRandomEncouragement(isCorrect),
    userAnswer: String(userAnswer),
    correctAnswer: String(correctAnswer),
  };
  
  if (!isCorrect) {
    // 根据题目类型生成提示
    switch (questionType) {
      case 'identify':
      case 'single_note':
        if (extraData?.userMidi !== undefined && extraData?.correctMidi !== undefined) {
          info.tip = getNoteComparisonTip(extraData.userMidi, extraData.correctMidi);
          info.mnemonic = NOTE_TIPS[extraData.correctMidi];
        }
        break;
        
      case 'interval':
      case 'interval_identify':
        if (extraData?.intervalName) {
          info.mnemonic = INTERVAL_MNEMONICS[extraData.intervalName];
        }
        break;
        
      case 'chord':
      case 'chord_identify':
        if (extraData?.chordType) {
          info.characteristic = CHORD_CHARACTERISTICS[extraData.chordType];
        }
        break;
    }
  }
  
  return info;
}
