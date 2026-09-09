import React, { useState } from 'react';
import { CounterView } from './components/CounterView';
import { Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full bg-[#f8fafc] overflow-hidden">
      {/* 最上部：ヘッダーバー */}
      <header className="shrink-0 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-2.5 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <a
            href="../"
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            ← TOP
          </a>

          {/* アプリタイトル */}
          <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 text-amber-900 font-extrabold px-3.5 py-1.5 rounded-full text-sm">
            <span className="text-base">🍺</span>
            <span>ビールカウンター</span>
          </div>

          {/* 音声トグルボタン */}
          <button
            id="sound-toggle-button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? '効果音をミュート' : '効果音を有効化'}
            title={soundEnabled ? '効果音: ON' : '効果音: OFF'}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200/70'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-700" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </header>

      {/* メインビュー */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <CounterView soundEnabled={soundEnabled} />
      </main>
    </div>
  );
}
