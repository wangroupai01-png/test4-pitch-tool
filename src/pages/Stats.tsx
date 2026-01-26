import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Target, Music, Mic, Clock, Award } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/useUserStore';
import { supabase } from '../lib/supabase';

const MotionDiv = motion.div as any;

// 能力维度
interface AbilityData {
  pitch: number;      // 音高识别
  interval: number;   // 音程辨别
  rhythm: number;     // 节奏感(预留)
  speed: number;      // 反应速度
  stability: number;  // 音准稳定性
}

// 进步数据
interface ProgressData {
  date: string;
  xp: number;
}

export const Stats = () => {
  const navigate = useNavigate();
  const { user, isGuest } = useUserStore();
  const [abilities, setAbilities] = useState<AbilityData>({
    pitch: 0,
    interval: 0,
    rhythm: 0,
    speed: 0,
    stability: 0,
  });
  const [weeklyProgress, setWeeklyProgress] = useState<ProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (isGuest || !user) {
      setLoading(false);
      return;
    }

    try {
      // 1. 计算能力值 - 从技能完成情况和答题正确率

      // 获取技能完成进度
      const { data: skillProgress } = await supabase
        .from('user_skill_progress')
        .select('skill_id, status')
        .eq('user_id', user.id);

      // 获取课程完成情况和星级
      const { data: lessonProgress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, stars, best_score')
        .eq('user_id', user.id);

      // 计算各维度能力值 (0-100)
      const pitchSkills = ['single_note', 'single_note_2', 'pitch_basic', 'pitch_advanced'];
      const intervalSkills = ['interval_basic', 'interval_advanced'];
      const speedSkills = ['speed_identify'];

      const calculateSkillScore = (skillIds: string[]) => {
        if (!skillProgress) return 0;
        const completed = skillProgress.filter(
          p => skillIds.includes(p.skill_id) && p.status === 'completed'
        ).length;
        return Math.min(100, (completed / skillIds.length) * 100);
      };

      // 计算平均星级作为稳定性
      const avgStars = lessonProgress && lessonProgress.length > 0
        ? lessonProgress.reduce((sum, l) => sum + (l.stars || 0), 0) / lessonProgress.length
        : 0;

      setAbilities({
        pitch: calculateSkillScore(pitchSkills),
        interval: calculateSkillScore(intervalSkills),
        rhythm: 20, // 预留，暂时给基础分
        speed: calculateSkillScore(speedSkills),
        stability: (avgStars / 3) * 100,
      });

      // 2. 获取最近7天的XP进度
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 简化：使用课程完成记录来模拟每日XP
      const { data: recentLessons } = await supabase
        .from('user_lesson_progress')
        .select('completed_at, best_score')
        .eq('user_id', user.id)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at');

      // 按日期分组统计
      const dailyXp: Record<string, number> = {};
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyXp[dateStr] = 0;
      }

      if (recentLessons) {
        recentLessons.forEach(lesson => {
          if (lesson.completed_at) {
            const dateStr = lesson.completed_at.split('T')[0];
            if (dailyXp[dateStr] !== undefined) {
              dailyXp[dateStr] += (lesson.best_score || 0) * 10;
            }
          }
        });
      }

      setWeeklyProgress(
        Object.entries(dailyXp).map(([date, xp]) => ({ date, xp }))
      );

    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // 雷达图SVG
  const RadarChart = ({ data }: { data: AbilityData }) => {
    const dimensions = [
      { key: 'pitch', label: '音高识别', icon: '🎵' },
      { key: 'interval', label: '音程辨别', icon: '🎼' },
      { key: 'rhythm', label: '节奏感', icon: '🥁' },
      { key: 'speed', label: '反应速度', icon: '⚡' },
      { key: 'stability', label: '音准稳定', icon: '🎯' },
    ];

    const centerX = 150;
    const centerY = 150;
    const maxRadius = 100;
    const levels = 5;

    // 计算点位置
    const getPoint = (index: number, value: number) => {
      const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2;
      const radius = (value / 100) * maxRadius;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    };

    // 生成网格线
    const gridLines = [];
    for (let level = 1; level <= levels; level++) {
      const points = dimensions.map((_, i) => {
        const point = getPoint(i, (level / levels) * 100);
        return `${point.x},${point.y}`;
      }).join(' ');
      gridLines.push(
        <polygon
          key={level}
          points={points}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      );
    }

    // 生成轴线
    const axisLines = dimensions.map((_, i) => {
      const endPoint = getPoint(i, 100);
      return (
        <line
          key={i}
          x1={centerX}
          y1={centerY}
          x2={endPoint.x}
          y2={endPoint.y}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      );
    });

    // 生成数据多边形
    const dataPoints = dimensions.map((dim, i) => {
      const value = data[dim.key as keyof AbilityData];
      const point = getPoint(i, value);
      return `${point.x},${point.y}`;
    }).join(' ');

    // 生成标签
    const labels = dimensions.map((dim, i) => {
      const point = getPoint(i, 120);
      const value = data[dim.key as keyof AbilityData];
      return (
        <g key={dim.key}>
          <text
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-bold fill-slate-600"
          >
            {dim.icon} {dim.label}
          </text>
          <text
            x={point.x}
            y={point.y + 14}
            textAnchor="middle"
            className="text-xs font-black fill-primary"
          >
            {Math.round(value)}%
          </text>
        </g>
      );
    });

    return (
      <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
        {gridLines}
        {axisLines}
        <polygon
          points={dataPoints}
          fill="rgba(127, 90, 240, 0.3)"
          stroke="#7F5AF0"
          strokeWidth="2"
        />
        {dimensions.map((dim, i) => {
          const value = data[dim.key as keyof AbilityData];
          const point = getPoint(i, value);
          return (
            <circle
              key={dim.key}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#7F5AF0"
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        {labels}
      </svg>
    );
  };

  // 柱状图
  const BarChart = ({ data }: { data: ProgressData[] }) => {
    const maxXp = Math.max(...data.map(d => d.xp), 100);

    return (
      <div className="flex items-end justify-between gap-2 h-40">
        {data.map((d, i) => {
          const height = maxXp > 0 ? (d.xp / maxXp) * 100 : 0;
          const dayName = new Date(d.date).toLocaleDateString('zh-CN', { weekday: 'short' });
          
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-primary">{d.xp > 0 ? d.xp : ''}</span>
              <MotionDiv
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: i * 0.1 }}
                className={`w-full rounded-t-lg border-2 border-dark ${
                  d.xp > 0 ? 'bg-gradient-to-t from-primary to-secondary' : 'bg-slate-200'
                }`}
                style={{ minHeight: d.xp > 0 ? '8px' : '4px' }}
              />
              <span className="text-xs font-bold text-slate-500">{dayName}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <header className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </Button>
        </header>
        <Card className="!p-8 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-2xl font-black mb-2">登录查看详细统计</h2>
          <p className="text-slate-500">登录后可查看能力分析和进步趋势</p>
        </Card>
      </div>
    );
  }

  // 计算综合能力值
  const overallScore = Math.round(
    (abilities.pitch + abilities.interval + abilities.rhythm + abilities.speed + abilities.stability) / 5
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-32">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回
        </Button>
        <h1 className="text-xl font-black">📊 我的能力分析</h1>
        <div className="w-20" />
      </header>

      {/* 综合评分 */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="!p-6 mb-6 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <p className="text-sm font-bold text-slate-500 mb-2">综合能力评分</p>
          <div className="text-6xl font-black text-primary mb-2">{overallScore}</div>
          <div className="inline-block px-4 py-1 rounded-full bg-white border-2 border-dark font-bold">
            {overallScore >= 80 ? '🏆 音乐大师' :
             overallScore >= 60 ? '⭐ 进阶学习者' :
             overallScore >= 40 ? '🎵 初级学员' : '🌱 音乐新手'}
          </div>
        </Card>
      </MotionDiv>

      {/* 能力雷达图 */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="!p-6 mb-6">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            能力雷达图
          </h2>
          <RadarChart data={abilities} />
        </Card>
      </MotionDiv>

      {/* 能力详情 */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="!p-6 mb-6">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <Music className="w-5 h-5 text-secondary" />
            能力详情
          </h2>
          <div className="space-y-4">
            {[
              { label: '音高识别', value: abilities.pitch, icon: '🎵', color: 'bg-primary' },
              { label: '音程辨别', value: abilities.interval, icon: '🎼', color: 'bg-secondary' },
              { label: '节奏感', value: abilities.rhythm, icon: '🥁', color: 'bg-accent' },
              { label: '反应速度', value: abilities.speed, icon: '⚡', color: 'bg-yellow-500' },
              { label: '音准稳定', value: abilities.stability, icon: '🎯', color: 'bg-green-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{item.icon} {item.label}</span>
                  <span className="font-black text-primary">{Math.round(item.value)}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden border-2 border-dark">
                  <MotionDiv
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </MotionDiv>

      {/* 每周进步 */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="!p-6 mb-6">
          <h2 className="text-lg font-black mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            本周学习进度
          </h2>
          <BarChart data={weeklyProgress} />
          <p className="text-center text-sm text-slate-500 mt-4">
            本周累计获得 <span className="font-black text-primary">
              {weeklyProgress.reduce((sum, d) => sum + d.xp, 0)}
            </span> XP
          </p>
        </Card>
      </MotionDiv>

      {/* 建议 */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="!p-6 bg-gradient-to-br from-accent/20 to-secondary/20">
          <h2 className="text-lg font-black mb-3">💡 学习建议</h2>
          <ul className="space-y-2 text-sm">
            {abilities.pitch < 60 && (
              <li className="flex items-start gap-2">
                <span className="shrink-0">🎵</span>
                <span>建议多练习【单音识别】课程，提升音高感知能力</span>
              </li>
            )}
            {abilities.interval < 60 && (
              <li className="flex items-start gap-2">
                <span className="shrink-0">🎼</span>
                <span>建议学习【音程基础】，理解不同音程的听感差异</span>
              </li>
            )}
            {abilities.speed < 60 && (
              <li className="flex items-start gap-2">
                <span className="shrink-0">⚡</span>
                <span>尝试【快速识音】课程，提升反应速度</span>
              </li>
            )}
            {abilities.stability < 60 && (
              <li className="flex items-start gap-2">
                <span className="shrink-0">🎯</span>
                <span>在【哼唱闯关】中多练习，提高音准稳定性</span>
              </li>
            )}
            {overallScore >= 60 && (
              <li className="flex items-start gap-2">
                <span className="shrink-0">🌟</span>
                <span>继续保持！尝试更高难度的课程挑战自己</span>
              </li>
            )}
          </ul>
        </Card>
      </MotionDiv>
    </div>
  );
};
