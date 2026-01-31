import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, BookOpen, Lightbulb, ArrowRight, Play, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { getFrequency, getMidiNoteName } from '../../utils/musicTheory';
import { useNavigate } from 'react-router-dom';

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

export interface AudioExample {
  label: string;
  midi: number;
  // 音程演示
  secondMidi?: number;
  // 和弦演示
  chordType?: string;
}

export interface TheoryContent {
  title: string;
  content: string;  // 支持简单的 Markdown 格式
  audioExamples?: AudioExample[];
  keyPoints?: string[];
  estimatedTime?: number;  // 预计阅读时间（秒）
}

interface TheorySectionProps {
  theory: TheoryContent;
  onComplete: () => void;
  lessonName: string;
}

export const TheorySection = ({ theory, onComplete, lessonName }: TheorySectionProps) => {
  const navigate = useNavigate();
  const { playNote, isReady } = useAudioPlayer();
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  // 播放音频示例
  const handlePlayExample = useCallback((example: AudioExample, index: number) => {
    if (!isReady) return;
    
    setPlayingIndex(index);
    
    if (example.chordType) {
      // 和弦播放
      let intervals: number[] = [0, 4, 7];
      switch (example.chordType) {
        case 'major': intervals = [0, 4, 7]; break;
        case 'minor': intervals = [0, 3, 7]; break;
        case 'dim': intervals = [0, 3, 6]; break;
        case 'aug': intervals = [0, 4, 8]; break;
      }
      intervals.forEach(interval => {
        playNote(getFrequency(example.midi + interval));
      });
    } else if (example.secondMidi !== undefined) {
      // 音程播放
      playNote(getFrequency(example.midi));
      setTimeout(() => {
        playNote(getFrequency(example.secondMidi!));
      }, 600);
    } else {
      // 单音播放
      playNote(getFrequency(example.midi));
    }
    
    // 重置播放状态
    setTimeout(() => setPlayingIndex(null), 1500);
  }, [isReady, playNote]);

  // 解析简单的 Markdown 格式
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        // 空行
        elements.push(<div key={index} className="h-3" />);
      } else if (trimmed.startsWith('## ')) {
        // 二级标题
        elements.push(
          <h3 key={index} className="text-xl font-black text-dark mt-6 mb-3">
            {trimmed.slice(3)}
          </h3>
        );
      } else if (trimmed.startsWith('### ')) {
        // 三级标题
        elements.push(
          <h4 key={index} className="text-lg font-bold text-dark mt-4 mb-2">
            {trimmed.slice(4)}
          </h4>
        );
      } else if (trimmed.startsWith('- ')) {
        // 列表项
        elements.push(
          <div key={index} className="flex items-start gap-2 my-1">
            <span className="text-primary mt-1">•</span>
            <span className="text-slate-600">{trimmed.slice(2)}</span>
          </div>
        );
      } else {
        // 普通段落
        elements.push(
          <p key={index} className="text-slate-600 leading-relaxed my-2">
            {trimmed}
          </p>
        );
      }
    });
    
    return elements;
  };

  return (
    <div className="min-h-screen bg-light-bg pattern-grid-lg flex flex-col">
      {/* Header */}
      <header className="p-4 bg-white border-b-3 border-dark shadow-neo-sm sticky top-0 z-30">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            {/* 返回按钮 */}
            <MotionButton 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-slate-100 rounded-xl border-2 border-dark hover:bg-slate-200 transition-colors"
              onClick={() => navigate(-1)}
            >
              <X className="w-5 h-5 text-dark" />
            </MotionButton>
            
            <div className="p-2 bg-primary/10 rounded-xl border-2 border-primary/20">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-bold">课前知识</p>
              <h1 className="text-lg font-black text-dark">{lessonName}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {theory.estimatedTime && (
              <div className="px-3 py-1 bg-slate-100 rounded-lg border-2 border-dark/10">
                <span className="text-sm text-slate-500 font-bold">
                  约 {Math.ceil(theory.estimatedTime / 60)} 分钟
                </span>
              </div>
            )}
            
            {/* 跳过理论按钮 */}
            <MotionButton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-3 py-1 bg-white rounded-lg border-2 border-dark/20 hover:border-primary hover:text-primary transition-all text-sm font-bold text-slate-500"
              onClick={onComplete}
            >
              跳过
            </MotionButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Theory Title */}
          <Card className="!p-6 mb-6">
            <h2 className="text-2xl font-black text-dark mb-4 flex items-center gap-3">
              <span className="text-3xl">📖</span>
              {theory.title}
            </h2>
            
            {/* Content */}
            <div className="prose max-w-none">
              {renderContent(theory.content)}
            </div>
          </Card>

          {/* Audio Examples */}
          {theory.audioExamples && theory.audioExamples.length > 0 && (
            <Card className="!p-6 mb-6">
              <h3 className="text-lg font-black text-dark mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                听一听
              </h3>
              
              <div className="grid gap-3">
                {theory.audioExamples.map((example, index) => (
                  <MotionButton
                    key={index}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                      ${playingIndex === index 
                        ? 'bg-primary text-white border-dark shadow-neo-sm' 
                        : 'bg-white border-dark/20 hover:border-primary hover:bg-primary/5'
                      }
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handlePlayExample(example, index)}
                  >
                    <div className={`
                      p-2 rounded-lg border-2
                      ${playingIndex === index 
                        ? 'bg-white/20 border-white/30' 
                        : 'bg-primary/10 border-primary/20'
                      }
                    `}>
                      {playingIndex === index ? (
                        <MotionDiv
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Volume2 className={`w-5 h-5 ${playingIndex === index ? 'text-white' : 'text-primary'}`} />
                        </MotionDiv>
                      ) : (
                        <Play className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <p className={`font-bold ${playingIndex === index ? 'text-white' : 'text-dark'}`}>
                        {example.label}
                      </p>
                      <p className={`text-sm ${playingIndex === index ? 'text-white/80' : 'text-slate-500'}`}>
                        {example.secondMidi !== undefined 
                          ? `${getMidiNoteName(example.midi)} → ${getMidiNoteName(example.secondMidi)}`
                          : getMidiNoteName(example.midi)
                        }
                      </p>
                    </div>
                  </MotionButton>
                ))}
              </div>
            </Card>
          )}

          {/* Key Points */}
          {theory.keyPoints && theory.keyPoints.length > 0 && (
            <Card className="!p-6 mb-6 bg-amber-50 border-amber-200">
              <h3 className="text-lg font-black text-dark mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                知识要点
              </h3>
              
              <div className="space-y-3">
                {theory.keyPoints.map((point, index) => (
                  <MotionDiv
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-400 border-2 border-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-black text-white">{index + 1}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{point}</p>
                  </MotionDiv>
                ))}
              </div>
            </Card>
          )}

          {/* Start Practice Button */}
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              className="w-full py-4 text-lg shadow-neo"
              onClick={onComplete}
            >
              我学会了，开始练习
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-center text-sm text-slate-400 mt-3">
              💡 理论学完后，通过练习巩固知识
            </p>
          </MotionDiv>
        </MotionDiv>
      </main>
    </div>
  );
};
