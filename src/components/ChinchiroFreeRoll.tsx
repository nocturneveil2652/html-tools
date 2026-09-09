import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Sparkles, Info, Award } from 'lucide-react';
import { Dice } from './Dice';
import { evaluateChinchiro } from '../utils/chinchiro';
import { playRollSound, playResultSound, playClickSound } from '../utils/sound';
import { YakuResult, RollHistoryItem } from '../types';

interface ChinchiroFreeRollProps {
  soundEnabled: boolean;
}

export const ChinchiroFreeRoll: React.FC<ChinchiroFreeRollProps> = ({ soundEnabled }) => {
  const [dice, setDice] = useState<[number, number, number]>([1, 2, 3]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [yaku, setYaku] = useState<YakuResult | null>(() => evaluateChinchiro([1, 2, 3]));
  const [history, setHistory] = useState<RollHistoryItem[]>([]);
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);

  const rollIntervalRef = useRef<number | null>(null);

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);
    playRollSound(soundEnabled);

    const duration = 650;

    rollIntervalRef.current = window.setInterval(() => {
      const temp1 = Math.floor(Math.random() * 6) + 1;
      const temp2 = Math.floor(Math.random() * 6) + 1;
      const temp3 = Math.floor(Math.random() * 6) + 1;
      setDice([temp1, temp2, temp3]);
    }, 60);

    setTimeout(() => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }

      const final1 = Math.floor(Math.random() * 6) + 1;
      const final2 = Math.floor(Math.random() * 6) + 1;
      const final3 = Math.floor(Math.random() * 6) + 1;
      const finalDice: [number, number, number] = [final1, final2, final3];

      setDice(finalDice);
      const evaluated = evaluateChinchiro(finalDice);
      setYaku(evaluated);
      setIsRolling(false);

      playResultSound(soundEnabled, evaluated.category);

      setHistory((prev) => [
        {
          id: `${Date.now()}-${Math.random()}`,
          dice: finalDice,
          result: evaluated,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
    }, duration);
  };

  return (
    <div className="flex flex-col h-full w-full justify-between overflow-y-auto">
      {/* ツールバー */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <span className="text-xs text-neutral-500 font-medium">
          サイコロを自由に振って役を確認できます
        </span>
        <button
          id="free-rules-toggle-button"
          onClick={() => {
            playClickSound(soundEnabled);
            setShowRuleModal(true);
          }}
          className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-200/80 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span>役一覧</span>
        </button>
      </div>

      {/* メインダイス・役結果 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 gap-5 max-w-lg mx-auto w-full">
        {/* サイコロ3つの並び */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 p-4 sm:p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-neutral-200/80 shadow-sm w-full">
          <Dice value={dice[0]} isRolling={isRolling} delay={0} size="md" />
          <Dice value={dice[1]} isRolling={isRolling} delay={0.08} size="md" />
          <Dice value={dice[2]} isRolling={isRolling} delay={0.16} size="md" />
        </div>

        {/* 役判定の表示カード */}
        <div className="w-full flex flex-col items-center min-h-[120px] justify-center">
          <AnimatePresence mode="wait">
            {isRolling ? (
              <motion.div
                key="rolling"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-neutral-500 font-medium"
              >
                <div className="flex items-center gap-2 text-lg text-indigo-600 font-bold">
                  <Dices className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>サイコロを振っています…</span>
                </div>
                <span className="text-xs text-neutral-400">役を自動判定中</span>
              </motion.div>
            ) : yaku ? (
              <motion.div
                key={yaku.name + dice.join('-')}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 18, stiffness: 220 }}
                className="flex flex-col items-center text-center gap-1.5 w-full"
              >
                <div
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-md ${yaku.badgeColor}`}
                >
                  {yaku.isSpecial && <Sparkles className="w-4 h-4" />}
                  <span>{yaku.name}</span>
                  {yaku.subName && (
                    <span className="text-xs font-normal opacity-90">({yaku.subName})</span>
                  )}
                </div>

                <p className="text-sm sm:text-base font-semibold text-neutral-700 mt-1">
                  {yaku.description}
                </p>

                <div className="text-xs text-neutral-600 font-mono tracking-wider bg-neutral-200/60 px-3 py-0.5 rounded-full">
                  出目: {dice[0]}・{dice[1]}・{dice[2]}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* 履歴クイックリスト */}
        {history.length > 0 && (
          <div className="w-full bg-white/40 rounded-2xl p-3 border border-neutral-200/60">
            <div className="text-xs font-semibold text-neutral-500 mb-1.5 px-1 flex items-center justify-between">
              <span>直近の履歴</span>
              <span className="text-[10px] text-neutral-400">最大10件</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {history.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-white/70 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-mono text-neutral-700 font-semibold">
                    <span>[{item.dice.join(', ')}]</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-neutral-800">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        item.result.category === 'pinzoro'
                          ? 'bg-amber-500'
                          : item.result.category === 'zorome'
                          ? 'bg-indigo-600'
                          : item.result.category === 'shigoro'
                          ? 'bg-emerald-600'
                          : item.result.category === 'hifumi'
                          ? 'bg-rose-600'
                          : item.result.category === 'normal'
                          ? 'bg-blue-600'
                          : 'bg-neutral-400'
                      }`}
                    />
                    <span>{item.result.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 下部アクションボタン */}
      <div className="flex w-full shrink-0 border-t border-neutral-200">
        <button
          id="free-roll-button"
          onClick={rollDice}
          disabled={isRolling}
          className={`flex-1 py-6 sm:py-7 text-white text-xl sm:text-2xl font-bold flex items-center justify-center gap-3 transition-colors ${
            isRolling
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 active:bg-indigo-700 cursor-pointer'
          }`}
        >
          <Dices className={`w-7 h-7 ${isRolling ? 'animate-spin' : ''}`} />
          <span>{isRolling ? '振っています…' : 'サイコロを振る'}</span>
        </button>
      </div>

      {/* 役一覧モーダル */}
      {showRuleModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setShowRuleModal(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-neutral-900">チンチロリンの役一覧</h3>
              </div>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-sm p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 text-sm">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between">
                <div>
                  <div className="font-bold text-amber-900">ピンゾロ (1-1-1)</div>
                  <div className="text-xs text-amber-700">最強の役！総取り（大勝ち・5倍付け）</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-500 text-white rounded-md">最強</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start justify-between">
                <div>
                  <div className="font-bold text-indigo-900">ゾロ目 (2-2-2 〜 6-6-6)</div>
                  <div className="text-xs text-indigo-700">3つ同じ数字が揃う（3倍付け）</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-md">大勝ち</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between">
                <div>
                  <div className="font-bold text-emerald-900">シション / シゴロ (4-5-6)</div>
                  <div className="text-xs text-emerald-700">昇順の連番。勝ち役（2倍付け）</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-md">強役</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start justify-between">
                <div>
                  <div className="font-bold text-blue-900">通常の目 (出目: 1〜6)</div>
                  <div className="text-xs text-blue-700">2つのサイコロが揃い、残り1つの数字が出目になる</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-md">通常</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 flex items-start justify-between">
                <div>
                  <div className="font-bold text-neutral-800">役なし（目なし）</div>
                  <div className="text-xs text-neutral-600">3つの目がバラバラで何も揃わない状態</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-neutral-500 text-white rounded-md">なし</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between">
                <div>
                  <div className="font-bold text-rose-900">ヒフミ (1-2-3)</div>
                  <div className="text-xs text-rose-700">最弱の出目…即負け（2倍払い）</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-rose-600 text-white rounded-md">負け役</span>
              </div>
            </div>

            <button
              onClick={() => setShowRuleModal(false)}
              className="mt-2 w-full py-2.5 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-colors"
            >
              閉じる
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
