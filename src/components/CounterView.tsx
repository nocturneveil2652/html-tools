import React, { useState } from 'react';
import { RotateCcw, Plus, Minus } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface CounterViewProps {
  soundEnabled: boolean;
}

export const CounterView: React.FC<CounterViewProps> = ({ soundEnabled }) => {
  const [count, setCount] = useState<number>(0);
  const [step, setStep] = useState<number>(1);

  const handleIncrement = () => {
    playClickSound(soundEnabled);
    setCount((prev) => prev + step);
  };

  const handleDecrement = () => {
    playClickSound(soundEnabled);
    setCount((prev) => Math.max(0, prev - step));
  };

  const handleReset = () => {
    playClickSound(soundEnabled);
    setCount(0);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f5f5f7] select-none justify-between overflow-hidden">
      {/* 上部の補助コントロール（ステップ値など） */}
      <div className="flex items-center justify-between px-6 pt-4 text-xs font-medium text-neutral-500">
        <div className="flex items-center gap-1.5 bg-neutral-200/80 p-1 rounded-lg">
          <span className="px-2 text-neutral-600">加算単位:</span>
          {[1, 5, 10].map((s) => (
            <button
              key={s}
              id={`step-button-${s}`}
              onClick={() => {
                playClickSound(soundEnabled);
                setStep(s);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                step === s
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              +{s}
            </button>
          ))}
        </div>
        <div className="text-neutral-400 text-xs">
          画面中央タップでもカウント
        </div>
      </div>

      {/* メインのカウント表示部（中央タップでもカウント可能） */}
      <div
        id="count"
        onClick={handleIncrement}
        className="flex-1 flex items-center justify-center font-bold text-[#1d1d1f] tracking-tight cursor-pointer active:scale-95 transition-transform"
        style={{ fontSize: 'min(28vw, 170px)' }}
        title="タップでカウントアップ"
      >
        {count}
      </div>

      {/* 下部のボタン群 */}
      <div className="flex w-full shrink-0 border-t border-neutral-200">
        {/* -1 ボタン */}
        <button
          id="decrement"
          onClick={handleDecrement}
          className="flex-none w-20 sm:w-24 bg-neutral-300 active:bg-neutral-400 text-neutral-700 font-bold text-xl flex items-center justify-center transition-colors border-r border-neutral-200/60"
          title={`-${step}`}
        >
          <Minus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* +1 メインボタン */}
        <button
          id="increment"
          onClick={handleIncrement}
          className="flex-1 py-7 sm:py-8 bg-[#007aff] active:bg-[#005ecb] text-white text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
          <span>+{step}</span>
        </button>

        {/* リセットボタン */}
        <button
          id="reset"
          onClick={handleReset}
          className="flex-none w-28 sm:w-36 bg-[#8e8e93] active:bg-[#6e6e73] text-white text-lg sm:text-xl font-semibold flex items-center justify-center gap-1.5 transition-colors border-l border-white/20"
        >
          <RotateCcw className="w-5 h-5 stroke-[2.5]" />
          <span>リセット</span>
        </button>
      </div>
    </div>
  );
};
