import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Plus, Minus, Clock, Settings2, Sparkles } from 'lucide-react';
import { playClickSound } from '../utils/sound';

interface CounterViewProps {
  soundEnabled: boolean;
}

const STORAGE_KEY_COUNT = 'beer_counter_val';
const STORAGE_KEY_START = 'beer_counter_start';

interface DrunkStatus {
  level: number; // 0 to 5
  label: string; // '素面', 'ほろ酔い', 'いい気分', 'ご機嫌', '千鳥足', 'ベロベロ'
  emoji: string;
  description: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  meterActiveColor: string;
  rapidWarning: boolean;
}

const getDrunkStatus = (count: number, diffMinutes: number): DrunkStatus => {
  if (count === 0) {
    return {
      level: 0,
      label: '素面（シラフ）',
      emoji: '😌',
      description: 'まだ素面です。マイペースに楽しもう！',
      cardBg: 'bg-slate-100/90',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-700',
      badgeBg: 'bg-slate-200',
      badgeText: 'text-slate-700',
      meterActiveColor: 'bg-emerald-500',
      rapidWarning: false,
    };
  }

  // 1時間に約0.6杯分のアルコールを代謝（標準的な代謝速度の近似）
  const elapsedHours = diffMinutes / 60;
  const metabolized = elapsedHours * 0.6;
  const effectiveCount = Math.max(0.5, count - metabolized);

  const paceMin = diffMinutes > 0 ? diffMinutes / count : 999;
  const isRapid = (count >= 2 && paceMin < 15) || (count >= 4 && paceMin < 25);

  if (effectiveCount < 1.4) {
    return {
      level: 1,
      label: 'ほろ酔い',
      emoji: '😊',
      description: isRapid ? 'ピッチ早め！ゆっくり会話を楽しんで' : 'ほんのり心地よいほろ酔い期。会話が弾む頃！',
      cardBg: 'bg-emerald-50/90',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-900',
      badgeBg: 'bg-emerald-200',
      badgeText: 'text-emerald-900',
      meterActiveColor: 'bg-emerald-500',
      rapidWarning: isRapid,
    };
  } else if (effectiveCount < 2.8) {
    return {
      level: 2,
      label: 'いい気分',
      emoji: '🍻',
      description: isRapid ? 'ペース早めです！和らぎ水（お冷）を挟もう' : '程よくお酒が回っています。お水も一杯どうぞ！',
      cardBg: 'bg-amber-50/90',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-900',
      badgeBg: 'bg-amber-200',
      badgeText: 'text-amber-900',
      meterActiveColor: 'bg-amber-500',
      rapidWarning: isRapid,
    };
  } else if (effectiveCount < 4.5) {
    return {
      level: 3,
      label: 'ご機嫌',
      emoji: '🥴',
      description: isRapid ? '⚠️ 急ピッチ注意！おつまみ休憩を挟みましょう' : 'だいぶ酔いを感じる頃。水分補給を忘れずに！',
      cardBg: 'bg-orange-50/90',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-900',
      badgeBg: 'bg-orange-200',
      badgeText: 'text-orange-900',
      meterActiveColor: 'bg-orange-500',
      rapidWarning: isRapid,
    };
  } else if (effectiveCount < 6.5) {
    return {
      level: 4,
      label: '千鳥足',
      emoji: '🤪',
      description: '足元ふらふら注意！ペースを落として休憩しましょう',
      cardBg: 'bg-rose-50/90',
      borderColor: 'border-rose-200',
      textColor: 'text-rose-900',
      badgeBg: 'bg-rose-200',
      badgeText: 'text-rose-900',
      meterActiveColor: 'bg-rose-500',
      rapidWarning: isRapid,
    };
  } else {
    return {
      level: 5,
      label: 'ベロベロ',
      emoji: '😵‍💫',
      description: 'ベロベロ警戒域！お水をたくさん飲んで深呼吸・休憩！',
      cardBg: 'bg-red-100/90',
      borderColor: 'border-red-300',
      textColor: 'text-red-950',
      badgeBg: 'bg-red-200',
      badgeText: 'text-red-950',
      meterActiveColor: 'bg-red-600',
      rapidWarning: isRapid,
    };
  }
};

export const CounterView: React.FC<CounterViewProps> = ({ soundEnabled }) => {
  const [count, setCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COUNT);
      return saved !== null ? Math.max(0, parseInt(saved, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });

  const [startTime, setStartTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_START);
      return saved !== null ? parseInt(saved, 10) || null : null;
    } catch {
      return null;
    }
  });

  const [now, setNow] = useState<number>(Date.now());
  const [step, setStep] = useState<number>(1);
  const [cheersToast, setCheersToast] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [customTimeStr, setCustomTimeStr] = useState<string>('');
  const arenaRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);

  // 1秒ごとに現在時刻を更新して経過時間をリアルタイム再計算
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // タイマー設定モーダルが開いたときにhh:mm入力を同期
  useEffect(() => {
    if (isTimerModalOpen) {
      const d = startTime ? new Date(startTime) : new Date();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setCustomTimeStr(`${hours}:${minutes}`);
    }
  }, [isTimerModalOpen, startTime]);

  // ローカルストレージに保存
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COUNT, String(count));
      if (startTime) {
        localStorage.setItem(STORAGE_KEY_START, String(startTime));
      } else {
        localStorage.removeItem(STORAGE_KEY_START);
      }
    } catch {}
  }, [count, startTime]);

  const showToast = (text: string) => {
    setCheersToast(text);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setCheersToast(null);
    }, 1000);
  };

  const handleIncrement = () => {
    playClickSound(soundEnabled);
    if (!startTime) {
      const newStart = Date.now();
      setStartTime(newStart);
    }
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
    if (count === 0 && !startTime) {
      showToast('すでに0杯です🍺');
      return;
    }
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    playClickSound(soundEnabled);
    setCount(0);
    setStartTime(null);
    try {
      localStorage.removeItem(STORAGE_KEY_COUNT);
      localStorage.removeItem(STORAGE_KEY_START);
    } catch {}
    setIsResetModalOpen(false);
    showToast('リセットしました（0杯）');
  };

  const handleBeerClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    playClickSound(soundEnabled);
    showToast(`🍺 ${index}杯目にかんぱーい！`);
  };

  // 飲み始め時刻のクイック設定
  const setQuickStartTime = (minutesAgo: number) => {
    const newStart = Date.now() - minutesAgo * 60 * 1000;
    setStartTime(newStart);
    setIsTimerModalOpen(false);
    playClickSound(soundEnabled);
    showToast(minutesAgo === 0 ? '飲み始めを開始しました⏱️' : `${minutesAgo}分前に開始を設定しました⏱️`);
  };

  // hh:mm 入力から開始時刻を設定
  const handleApplyCustomTime = () => {
    if (!customTimeStr) return;
    const parts = customTimeStr.split(':');
    if (parts.length !== 2) {
      showToast('hh:mm形式で入力してください');
      return;
    }
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      showToast('有効な時刻を入力してください');
      return;
    }

    const target = new Date();
    target.setHours(h, m, 0, 0);

    // 未来時刻（例: 現在01:00で23:30と入力）の場合は前日扱い
    if (target.getTime() > Date.now()) {
      target.setDate(target.getDate() - 1);
    }

    setStartTime(target.getTime());
    setIsTimerModalOpen(false);
    playClickSound(soundEnabled);
    showToast(`${customTimeStr} 開始に設定しました⏱️`);
  };

  const clearStartTime = () => {
    setStartTime(null);
    setIsTimerModalOpen(false);
    playClickSound(soundEnabled);
    showToast('タイマーをクリアしました');
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

  // 経過時間＆ペースの計算
  const diffMs = startTime ? Math.max(0, now - startTime) : 0;
  const diffSeconds = Math.floor((diffMs % 60000) / 1000);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;

  // 「何分前から飲んでいるか」の表示テキスト
  let elapsedAgoText = '飲み始め未記録（カウントで開始）';
  if (startTime) {
    if (diffMinutes === 0) {
      elapsedAgoText = `たった今飲み始めました（${diffSeconds}秒前）`;
    } else if (diffHours === 0) {
      elapsedAgoText = `${diffMinutes}分前から飲んでいます`;
    } else {
      elapsedAgoText = `${diffHours}時間${remMinutes}分前から飲んでいます`;
    }
  }

  // 経過時間
  const elapsedDurationText = diffHours > 0 ? `${diffHours}時間${remMinutes}分` : `${diffMinutes}分`;

  // 開始時刻表示 (HH:mm)
  const startFormatted = startTime
    ? new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // ペース (何分に1杯ペースか)
  const paceMin = count > 0 && diffMinutes > 0 ? Math.round(diffMinutes / count) : null;

  // 酔っ払い度ステータス
  const drunkStatus = getDrunkStatus(count, diffMinutes);

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-[#f8fafc] select-none justify-between overflow-hidden">
      {/* 上部ステップ切替バー */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1 text-xs font-medium text-slate-500">
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

      {/* 🍶 画面上部：酔っ払い度ステータスバナー */}
      <div
        id="drunk-status-card"
        className={`mx-3 mt-1 px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 shadow-xs transition-colors ${drunkStatus.cardBg} ${drunkStatus.borderColor}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl shrink-0" role="img" aria-label={drunkStatus.label}>
            {drunkStatus.emoji}
          </span>
          <div className="min-w-0 flex flex-col text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                酔っ払い度
              </span>
              <span className={`text-xs sm:text-sm font-black tracking-tight ${drunkStatus.textColor}`}>
                【{drunkStatus.label}】
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${drunkStatus.badgeBg} ${drunkStatus.badgeText}`}>
                Lv.{drunkStatus.level}/5
              </span>
              {drunkStatus.rapidWarning && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-red-100 text-red-800 border border-red-200 animate-pulse">
                  ⚠️ ハイペース
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-600 truncate mt-0.5">
              {drunkStatus.description}
            </div>
          </div>
        </div>

        {/* 5段階のレベルゲージ */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`w-2 sm:w-2.5 h-3.5 rounded-xs transition-all ${
                  lvl <= drunkStatus.level ? drunkStatus.meterActiveColor : 'bg-slate-200/80'
                }`}
              />
            ))}
          </div>
          <span className="text-[9px] font-semibold text-slate-400">
            {count > 0 ? `${count}杯` : '素面'}
          </span>
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

      {/* ⏱️ 飲酒タイマー表示カード */}
      <div className="mx-3 mt-1 mb-1.5 px-3 py-2 bg-amber-50/70 hover:bg-amber-50 border border-amber-200/90 rounded-xl shadow-xs flex items-center justify-between gap-2.5 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex-none p-1.5 bg-amber-500/15 text-amber-700 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex flex-col text-left">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight truncate">
                {elapsedAgoText}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {startTime ? (
                <>
                  <span>開始: <strong className="text-slate-700">{startFormatted}</strong></span>
                  <span>•</span>
                  <span>経過: <strong className="text-slate-700">{elapsedDurationText}</strong></span>
                  {paceMin !== null && (
                    <>
                      <span>•</span>
                      <span className="text-amber-800 font-semibold bg-amber-200/60 px-1 py-0.2 rounded text-[10px]">
                        約{paceMin}分/杯
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="text-slate-400">「+1」カウントで自動スタート</span>
              )}
            </div>
          </div>
        </div>

        {/* 時間調整・開始ボタン */}
        <button
          type="button"
          id="timer-settings-button"
          onClick={() => setIsTimerModalOpen(true)}
          className="flex-none px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-xs flex items-center gap-1 transition-colors"
          title="開始時刻を変更・調整"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{startTime ? '変更' : '記録'}</span>
        </button>
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
              カウント＆タイマーのリセット
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              これまでの記録（<span className="font-bold text-amber-600">{count}</span>杯）および飲酒タイマーの記録を0に戻しますか？
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

      {/* 飲み始め時刻設定モーダル */}
      {isTimerModalOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsTimerModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-3xl mb-1.5">⏱️</div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              飲み始め時刻の設定
            </h3>
            <p className="text-xs text-slate-500 mb-3.5 leading-relaxed">
              {startTime
                ? `現在: ${startFormatted} 開始（${elapsedDurationText}経過）`
                : '何時何分から飲み始めたかを記録できます'}
            </p>

            {/* 🕒 hh:mm 直接指定フォーム */}
            <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
              <label htmlFor="custom-time-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                🕒 開始時刻を直接指定 (hh:mm)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="custom-time-input"
                  type="time"
                  value={customTimeStr}
                  onChange={(e) => setCustomTimeStr(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  id="apply-time-button"
                  onClick={handleApplyCustomTime}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  設定
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                例: 19:30から飲み始めた場合は「19:30」
              </span>
            </div>

            {/* クイック選択 */}
            <div className="text-[11px] font-bold text-slate-500 text-left mb-1.5 px-0.5">
              クイック選択
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setQuickStartTime(0)}
                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex flex-col items-center justify-center"
              >
                <span>今すぐ開始</span>
                <span className="text-[10px] text-amber-700 font-normal">（0分前）</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickStartTime(15)}
                className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex flex-col items-center justify-center"
              >
                <span>15分前から</span>
                <span className="text-[10px] text-slate-500 font-normal">ちょっと前に開始</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickStartTime(30)}
                className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex flex-col items-center justify-center"
              >
                <span>30分前から</span>
                <span className="text-[10px] text-slate-500 font-normal">約半時間前</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickStartTime(60)}
                className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex flex-col items-center justify-center"
              >
                <span>1時間前から</span>
                <span className="text-[10px] text-slate-500 font-normal">60分前</span>
              </button>
            </div>

            {startTime && (
              <button
                type="button"
                onClick={clearStartTime}
                className="w-full py-2 mb-3 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              >
                タイマーのみ停止・クリア
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsTimerModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
