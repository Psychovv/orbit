import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

// Stagger container for animating children one by one
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className, staggerDelay = 0.06 }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.05
        }
      }
    }}
  >
    {children}
  </motion.div>
);

// Individual animated item that fades/slides up
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300
    }
  }
};

export const FadeUp: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    transition={{
      type: 'spring',
      damping: 25,
      stiffness: 300,
      delay
    }}
  >
    {children}
  </motion.div>
);

// Scale in animation (for cards, modals)
export const ScaleIn: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}> = ({ children, className, delay = 0, onKeyDown }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
    transition={{
      type: 'spring',
      damping: 22,
      stiffness: 280,
      delay
    }}
    onKeyDown={onKeyDown}
  >
    {children}
  </motion.div>
);

// Slide up for modals and overlays
export const SlideUp: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ children, className, onClick }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    transition={{
      type: 'spring',
      damping: 28,
      stiffness: 350
    }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// Backdrop overlay fade - can wrap children (e.g. for click-outside areas)
export const Backdrop: React.FC<{
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className = '' }) => (
  <motion.div
    className={`fixed inset-0 ${className}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// Stagger item (used inside StaggerContainer)
export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div className={className} variants={fadeUpVariants}>
    {children}
  </motion.div>
);

// Re-export AnimatePresence for convenience
export { AnimatePresence };
