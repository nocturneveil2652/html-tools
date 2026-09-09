import React from 'react';
import { motion } from 'motion/react';

interface DiceProps {
  value: number; // 1 ~ 6
  isRolling?: boolean;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}

export const Dice: React.FC<DiceProps> = ({
  value,
  isRolling = false,
  size = 'md',
  delay = 0,
}) => {
  // サイズごとのクラス
  const sizeClasses = {
    sm: 'w-12 h-12 rounded-xl p-1.5 shadow-sm',
    md: 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-2.5 shadow-md',
    lg: 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-3 shadow-lg',
  }[size];

  const dotSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
    lg: 'w-4.5 h-4.5 sm:w-5 sm:h-5',
  }[size];

  const dot1Sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-8 h-8 sm:w-9 sm:h-9',
  }[size];

  // 1の目は日本の伝統的な赤い大きな丸、他はダークカラー
  const renderDots = () => {
    switch (value) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <span className={`${dot1Sizes} rounded-full bg-red-600 shadow-inner`} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-1">
            <div className="flex items-start justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div />
            <div />
            <div className="flex items-end justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1">
            <div className="flex items-start justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div /><div />
            <div /><div className="flex items-center justify-center">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div><div />
            <div /><div /><div className="flex items-end justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 p-1">
            <div className="flex items-start justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-start justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-end justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-end justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1">
            <div className="flex items-start justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div />
            <div className="flex items-start justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div />
            <div className="flex items-center justify-center">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div />
            <div className="flex items-end justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div />
            <div className="flex items-end justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-3 p-1">
            <div className="flex items-center justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-center justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-center justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-center justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-center justify-start">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
            <div className="flex items-center justify-end">
              <span className={`${dotSizes} rounded-full bg-neutral-900`} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`relative bg-white border border-neutral-200/80 select-none flex items-center justify-center ${sizeClasses}`}
      animate={
        isRolling
          ? {
              rotate: [0, -18, 22, -12, 15, 0],
              y: [0, -18, 4, -10, 2, 0],
              scale: [1, 1.08, 0.96, 1.03, 1],
            }
          : { rotate: 0, y: 0, scale: 1 }
      }
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeInOut',
      }}
    >
      {renderDots()}
    </motion.div>
  );
};
