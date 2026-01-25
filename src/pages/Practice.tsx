import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Headphones, Music, Dumbbell, ArrowRight, Lightbulb } from 'lucide-react';
import { Card } from '../components/ui/Card';

const MotionDiv = motion.div as any;

const practiceModesData = [
  {
    id: 'free',
    title: '自由哼唱',
    description: '实时音高可视化，无评分压力，自由探索你的音域',
    icon: Mic,
    colorVariant: 'accent',
    bgColor: 'bg-accent',
    path: '/free',
  },
  {
    id: 'quiz',
    title: '听音辨位',
    description: '聆听音符，在钢琴键盘上找到正确的位置',
    icon: Headphones,
    colorVariant: 'secondary',
    bgColor: 'bg-secondary',
    path: '/quiz',
  },
  {
    id: 'sing',
    title: '哼唱闯关',
    description: '根据目标音高哼唱，挑战你的音准极限',
    icon: Music,
    colorVariant: 'primary',
    bgColor: 'bg-primary',
    path: '/sing',
  },
];

export const Practice = () => {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header - Neo-Brutalism Style */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-white border-3 border-dark rounded-2xl shadow-neo p-6 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-accent rounded-full border-3 border-dark opacity-50" />
          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-primary rounded-full border-3 border-dark opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-accent rounded-xl border-3 border-dark shadow-neo-sm">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-dark">练习场</h1>
            </div>
            <p className="text-slate-500 font-bold">自由练习，无拘无束 🎤</p>
          </div>
        </div>
      </MotionDiv>

      {/* Practice Modes - Card Grid */}
      <div className="space-y-6">
        {practiceModesData.map((mode, index) => (
          <MotionDiv
            key={mode.id}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.1, type: 'spring' }}
            onHoverStart={() => setHoveredMode(mode.id)}
            onHoverEnd={() => setHoveredMode(null)}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={mode.path}>
              <Card 
                variant={hoveredMode === mode.id ? (mode.colorVariant as any) : 'white'}
                className="!p-0 overflow-hidden transition-colors duration-200 cursor-pointer h-full"
              >
                <div className="flex h-full min-h-[160px]">
                  {/* Icon Side */}
                  <div className={`
                    ${mode.bgColor} w-32 md:w-40 flex items-center justify-center border-r-3 border-dark shrink-0
                    ${hoveredMode === mode.id ? 'bg-white/90' : ''}
                  `}>
                    <MotionDiv
                      animate={hoveredMode === mode.id ? { rotate: 12, scale: 1.1 } : { rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`
                        p-5 rounded-2xl border-3 border-dark shadow-neo-sm
                        ${hoveredMode === mode.id ? 'bg-white' : 'bg-white/20'}
                      `}
                    >
                      <mode.icon className={`w-12 h-12 ${hoveredMode === mode.id ? 'text-dark' : 'text-white'}`} />
                    </MotionDiv>
                  </div>
                  
                  {/* Content Side */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-black text-2xl md:text-3xl">{mode.title}</h3>
                      <p className="text-base font-bold opacity-80 mt-3 leading-relaxed">
                        {mode.description}
                      </p>
                    </div>
                    
                    {/* Arrow */}
                    <div className="flex justify-end mt-4">
                      <div className={`
                        p-2.5 rounded-xl transform transition-all border-2
                        ${hoveredMode === mode.id 
                          ? 'bg-white text-dark border-dark shadow-neo-sm translate-x-1' 
                          : 'bg-dark text-white border-transparent'
                        }
                      `}>
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </MotionDiv>
        ))}
      </div>

      {/* Tips Card */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card className="!p-5 !bg-gradient-to-br !from-primary/5 !to-secondary/5 relative overflow-hidden">
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-secondary/20 rounded-full border-2 border-dark/10" />
          
          <div className="relative z-10">
            <h4 className="font-black text-dark flex items-center gap-2 text-lg">
              <div className="p-1.5 bg-secondary rounded-lg border-2 border-dark">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              练习小贴士
            </h4>
            <p className="text-sm text-slate-600 font-medium mt-3 leading-relaxed">
              每天练习 <span className="font-black text-primary">10-15分钟</span> 效果最佳。
              先从「听音辨位」开始训练音感，再挑战「哼唱闯关」提升音准！
            </p>
          </div>
        </Card>
      </MotionDiv>
    </div>
  );
};
