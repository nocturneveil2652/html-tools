import React, { useState } from 'react';
import { ChinchiroGame } from './ChinchiroGame';
import { ChinchiroFreeRoll } from './ChinchiroFreeRoll';
import { Gamepad2, Dices } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface ChinchiroViewProps {
  soundEnabled: boolean;
}

export type ChinchiroSubMode = 'game' | 'free';

export const ChinchiroView: React.FC<ChinchiroViewProps> = ({ soundEnabled }) => {
  const [mode, setMode] = useState<ChinchiroSubMode>('game');

  const handleModeChange = (newMode: ChinchiroSubMode) => {
    playClickSound(soundEnabled);
    setMode(newMode);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f5f5f7] select-none justify-between overflow-hidden">
      {/* チンチロリン内部のモードセレクター */}
      <div className="shrink-0 px-4 pt-2.5 pb-1 max-w-md mx-auto w-full">
        <div className="bg-neutral-200/80 p-0.5 rounded-xl flex items-center border border-neutral-300/50">
          <button
            id="chinchiro-mode-game"
            onClick={() => handleModeChange('game')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === 'game'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>対戦ゲーム (手順ルール通り)</span>
          </button>

          <button
            id="chinchiro-mode-free"
            onClick={() => handleModeChange('free')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === 'free'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>フリー練習 (自由ロール)</span>
          </button>
        </div>
      </div>

      {/* サブモードのビュー切り替え */}
      <div className="flex-1 overflow-hidden">
        {mode === 'game' ? (
          <ChinchiroGame soundEnabled={soundEnabled} />
        ) : (
          <ChinchiroFreeRoll soundEnabled={soundEnabled} />
        )}
      </div>
    </div>
  );
};
