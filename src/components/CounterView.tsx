import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Plus, Minus } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface CounterViewProps {
  soundEnabled: boolean;
}

export const CounterView: React.FC<CounterViewProps> = ({ soundEnabled }) => {
  const [count, setCount] = useState<number>(0);
  const [step, setStep] = useState<number>(1);
  const [cheersToast, setCheersToast] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const arenaRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (text: string) => {
    setCheersToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setCheersToast(null);
    }, 900);
  };

  const handleIncrement = () => {
    playClickSound(soundEnabled);
    setCount((prev) => {
      const next = prev + step;
      showToast(next % 10 === 0 ? `🎉 ${next}杯達成！かんぱーい！` : `✨ かんぱーい！ (${next}杯目)`);
      return next;
    });
  };

  const handleDecrement = () => {
    playClickSound(soundEnabled);
    setCount((prev) => Math.max(0, prev - step));
  };

  const handleResetClick = () => {
    if (count === 0) {
      showToast('すでに0杯です🍺');
      return;
    }
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    playClickSound(soundEnabled);
    setCount(0);
    setIsResetModalOpen(false);
    showToast('リセットしました（0杯）');
  };

  const handleBeerClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    playClickSound(soundEnabled);
    showToast(`🍺 ${index}杯目にかんぱーい！`);
  };

  // ビールが増えたら最下部へスクロール
  useEffect(() => {
    if (arenaRef.current && count > 0) {
      arenaRef.current.scrollTo({
        top: arenaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [count]);

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-[#f8fafc] select-none justify-between overflow-hidden">
      {/* 上部ステップ切替バー */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
          <span className="px-2 text-slate-600 font-bold text-[11px]">加算:</span>
          {[1, 5, 10].map((s) => (
            <button
              key={s}
              id={`step-button-${s}`}
              onClick={() => {
                playClickSound(soundEnabled);
                setStep(s);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                step === s
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              +{s}
            </button>
          ))}
        </div>
        <div className="text-slate-400 text-xs">
          タップでもカウント🍺
        </div>
      </div>

      {/* カウント数字表示部 */}
      <div
        id="count"
        onClick={handleIncrement}
        className="flex flex-col items-center justify-center pt-2 pb-1 cursor-pointer active:scale-95 transition-transform"
        title="タップでカウントアップ"
      >
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-6xl sm:text-7xl font-black text-amber-900 tracking-tight">
            {count}
          </span>
          <span className="text-xl sm:text-2xl font-extrabold text-amber-600">
            杯
          </span>
        </div>

        {/* トースト表示 */}
        <div className={`text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-3 py-0.5 rounded-full transition-all duration-200 mt-1 ${cheersToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
          {cheersToast || '✨ かんぱーい！'}
        </div>
      </div>

      {/* 🍺 ビールが並ぶアリーナ */}
      <div
        ref={arenaRef}
        onClick={handleIncrement}
        className="flex-1 mx-3 my-2 p-3 bg-gradient-to-b from-[#fffdfa] to-[#fffbeb] border-2 border-dashed border-amber-300 rounded-2xl overflow-y-auto shadow-inner cursor-pointer"
      >
        {count === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2 p-4">
            <span className="text-5xl animate-bounce">🍺</span>
            <p className="text-sm font-bold text-amber-900">まだビールはありません</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              「+1」ボタンや画面をタップして<br />飲んだ杯数をカウントしましょう！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 w-full">
            {Array.from({ length: count }, (_, i) => i + 1).map((num) => (
              <div
                key={num}
                onClick={(e) => handleBeerClick(e, num)}
                className="bg-white border border-amber-200 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm hover:scale-105 active:scale-90 transition-transform cursor-pointer"
                title={`${num}杯目のビール`}
              >
                <span className="text-3xl filter drop-shadow">🍺</span>
                <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded-md mt-1">
                  #{num}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 下部のボタン群 */}
      <div className="flex w-full shrink-0 border-t border-slate-200 bg-white">
        {/* -1 ボタン */}
        <button
          id="decrement"
          onClick={handleDecrement}
          className="flex-none w-20 sm:w-24 bg-slate-100 active:bg-slate-200 text-slate-700 font-bold text-2xl flex items-center justify-center transition-colors border-r border-slate-200"
          title={`-${step}`}
        >
          <Minus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* +1 メインボタン */}
        <button
          id="increment"
          onClick={handleIncrement}
          className="flex-1 py-5 sm:py-6 bg-gradient-to-r from-amber-500 to-amber-600 active:from-amber-600 active:to-amber-700 text-white text-xl sm:text-2xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-inner"
        >
          <span className="text-2xl">🍺</span>
          <span>+{step} 杯</span>
        </button>

        {/* リセットボタン */}
        <button
          id="reset"
          onClick={handleResetClick}
          className="flex-none w-24 sm:w-28 bg-slate-100 active:bg-red-50 active:text-red-600 text-slate-500 text-sm font-bold flex items-center justify-center gap-1 transition-colors border-l border-slate-200"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
          <span>リセット</span>
        </button>
      </div>

      {/* リセット確認モーダル */}
      {isResetModalOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsResetModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              カウントのリセット
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              これまでの記録（<span className="font-bold text-amber-600">{count}</span>杯）を0に戻しますか？
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                id="confirm-reset-button"
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
