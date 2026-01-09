import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// Simplified loose typing to avoid build conflicts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  [key: string]: any; // Allow any other prop (like motion props)
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = "font-black transition-all duration-200 border-3 border-dark focus:outline-none flex items-center justify-center gap-2 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-neo",
    secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-neo",
    accent: "bg-accent text-white hover:bg-accent-hover shadow-neo",
    outline: "bg-white text-dark hover:bg-slate-50 shadow-neo",
    ghost: "border-transparent shadow-none hover:bg-black/5 active:translate-x-0 active:translate-y-0",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-xl rounded-xl",
  };

  const MotionBtn = motion.button as any;

  return (
    <MotionBtn
      whileHover={{ scale: 1.02, rotate: 1 }}
      whileTap={{ scale: 0.95, rotate: 0 }}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </MotionBtn>
  );
};
