import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Dumbbell, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div as any;

const tabs = [
  { path: '/learn', label: '学习', icon: BookOpen, color: 'bg-secondary' },
  { path: '/practice', label: '练习', icon: Dumbbell, color: 'bg-primary' },
  { path: '/compete', label: '竞技', icon: Trophy, color: 'bg-accent' },
  { path: '/profile', label: '我的', icon: User, color: 'bg-primary' },
];

export const TabLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-light-bg flex flex-col pattern-grid-lg">
      {/* Main Content - XPBar 已移到全局 */}
      <main className="flex-1 overflow-auto pb-40">
        <Outlet />
      </main>
      
      {/* Bottom Tab Bar - Neo-Brutalism Style */}
      <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 safe-area-bottom pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-white border-3 border-dark rounded-2xl shadow-neo-lg flex justify-around items-center h-20 px-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.path}
                to={tab.path}
                className="flex-1 h-full flex items-center justify-center"
              >
                {({ isActive }) => (
                  <MotionDiv
                    initial={false}
                    animate={isActive ? { y: -8, scale: 1.1 } : { y: 0, scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`
                      flex flex-col items-center justify-center w-14 h-14 rounded-xl
                      transition-all duration-200
                      ${isActive 
                        ? `${tab.color} text-white border-3 border-dark shadow-neo-sm` 
                        : 'text-slate-400 hover:text-slate-600'
                      }
                    `}
                  >
                    <tab.icon className={`w-6 h-6 ${isActive ? 'stroke-[3]' : 'stroke-2'}`} />
                  </MotionDiv>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};
