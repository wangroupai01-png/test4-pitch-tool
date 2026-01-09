import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  variant?: 'white' | 'primary' | 'secondary' | 'accent' | 'dark';
}

export const Card: React.FC<CardProps> = ({ children, className, title, onClick, variant = 'white', ...props }) => {
  const MotionDiv = motion.div as any;
  
  const bgColors = {
    white: "bg-white",
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    accent: "bg-accent text-white",
    dark: "bg-dark text-white"
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02, rotate: 1 } : undefined} // Rotate right to avoid left overflow issues
      whileTap={onClick ? { scale: 0.98, rotate: 0 } : undefined}
      onClick={onClick}
      className={clsx(
        "rounded-xl p-6 border-3 border-dark shadow-neo transition-all", // explicit border-dark
        bgColors[variant],
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {title && <h3 className={clsx("text-2xl font-black mb-4", "text-inherit")}>{title}</h3>}
      {children}
    </MotionDiv>
  );
};
