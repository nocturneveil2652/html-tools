import React, { useState } from 'react';
import { TabType } from './types';
import { CounterView } from './components/CounterView';
import { ChinchiroView } from './components/ChinchiroView';
import { Volume2, VolumeX, Calculator, Dices } from 'lucide-react';
import { playClickSound } from './utils/sound';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('counter');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleTabChange = (tab: TabType) => {
    playClickSound(soundEnabled);
    setCurrentTab(tab);
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full bg-[#f5f5f7] overflow-hidden">
      {/* 最上部：切り替えタブバー */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-2.5 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* セグメント切り替えタブ */}
          <div
            id="tab-group"
            className="flex-1 bg-neutral-100 p-1 rounded-xl flex items-center shadow-inner border border-neutral-200/60"
          >
            <button
              id="tab-counter"
              onClick={() => handleTabChange('counter')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                currentTab === 'counter'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>カウンター</span>
            </button>

            <button
              id="tab-chinchiro"
              onClick={() => handleTabChange('chinchiro')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                currentTab === 'chinchiro'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>チンチロリン</span>
            </button>
          </div>

          {/* 音声トグルボタン */}
          <button
            id="sound-toggle-button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? '効果音をミュート' : '効果音を有効化'}
            title={soundEnabled ? '効果音: ON' : '効果音: OFF'}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200/70'
                : 'bg-neutral-100 text-neutral-400 border-neutral-200 hover:bg-neutral-200/70'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-neutral-700" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            )}
          </button>
        </div>
      </header>

      {/* メインビュー */}
      <main className="flex-1 relative overflow-hidden">
        {currentTab === 'counter' ? (
          <CounterView soundEnabled={soundEnabled} />
        ) : (
          <ChinchiroView soundEnabled={soundEnabled} />
        )}
      </main>
    </div>
  );
}
