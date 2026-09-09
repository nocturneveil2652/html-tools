import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crown,
  User,
  Bot,
  Dices,
  Coins,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Dice } from './Dice';
import { evaluateChinchiro, calculateBattleOutcome } from '../utils/chinchiro';
import { playRollSound, playResultSound, playClickSound } from '../utils/sound';
import { Player, GamePhase, YakuResult, ChildBattleResult } from '../types';

interface ChinchiroGameProps {
  soundEnabled: boolean;
}

const DEFAULT_PLAYERS: Player[] = [
  { id: 'p1', name: 'あなた (P1)', isCpu: false, chips: 1000, avatarColor: 'bg-blue-600' },
  { id: 'p2', name: 'CPU 太郎 (P2)', isCpu: true, chips: 1000, avatarColor: 'bg-purple-600' },
  { id: 'p3', name: 'CPU 花子 (P3)', isCpu: true, chips: 1000, avatarColor: 'bg-emerald-600' },
];

export const ChinchiroGame: React.FC<ChinchiroGameProps> = ({ soundEnabled }) => {
  // ゲーム全体の状態
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [parentIndex, setParentIndex] = useState<number>(0);
  const [parentTurnCount, setParentTurnCount] = useState<number>(0); // 何人親をやったか

  // 現在のラウンド情報
  const [bets, setBets] = useState<Record<string, number>>({});
  const [parentYaku, setParentYaku] = useState<YakuResult | null>(null);
  const [parentDice, setParentDice] = useState<[number, number, number]>([1, 2, 3]);
  const [parentRollCount, setParentRollCount] = useState<number>(0);

  // 子の手番進行
  const [childTurnQueue, setChildTurnQueue] = useState<string[]>([]);
  const [currentChildIndex, setCurrentChildIndex] = useState<number>(0);
  const [currentChildRollCount, setCurrentChildRollCount] = useState<number>(0);
  const [currentChildDice, setCurrentChildDice] = useState<[number, number, number]>([1, 2, 3]);
  const [currentChildYaku, setCurrentChildYaku] = useState<YakuResult | null>(null);

  // ラウンド結果
  const [roundBattleResults, setRoundBattleResults] = useState<ChildBattleResult[]>([]);

  // ダイスロール中フラグ
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [activeDisplayDice, setActiveDisplayDice] = useState<[number, number, number]>([1, 2, 3]);

  // アナウンス・ログメッセージ
  const [message, setMessage] = useState<string>('');

  const rollIntervalRef = useRef<number | null>(null);

  // 現在の親
  const currentParent = players[parentIndex];
  // 現在の手番の子
  const currentChildId = childTurnQueue[currentChildIndex];
  const currentChild = players.find((p) => p.id === currentChildId);

  // ゲーム開始
  const startGame = () => {
    playClickSound(soundEnabled);
    setParentIndex(0);
    setParentTurnCount(0);
    startRoundWithParent(0);
  };

  // 親を指定してラウンド開始（ベットフェーズ）
  const startRoundWithParent = (pIdx: number) => {
    setParentIndex(pIdx);
    const parentPlayer = players[pIdx];

    // 親以外の子一覧
    const childIds = players.filter((_, idx) => idx !== pIdx).map((p) => p.id);
    setChildTurnQueue(childIds);

    // デフォルトベット設定 (子それぞれの所持金に応じたベット)
    const initialBets: Record<string, number> = {};
    childIds.forEach((id) => {
      const p = players.find((pl) => pl.id === id);
      const defaultBet = p ? Math.min(100, Math.max(10, Math.floor(p.chips / 10))) : 100;
      initialBets[id] = defaultBet;
    });
    setBets(initialBets);

    setParentYaku(null);
    setParentRollCount(0);
    setRoundBattleResults([]);
    setCurrentChildIndex(0);
    setCurrentChildRollCount(0);
    setCurrentChildYaku(null);

    setPhase('betting');
    setMessage(`【${parentPlayer.name}】が親です。子が賭け金を決めます。`);
  };

  // 親の権利パス
  const handlePassParent = () => {
    playClickSound(soundEnabled);
    const nextIndex = (parentIndex + 1) % players.length;
    setMessage(`【${currentParent.name}】は親の権利をパスしました。左隣の【${players[nextIndex].name}】に親が移ります。`);
    startRoundWithParent(nextIndex);
  };

  // ベット確定して親のサイコロフェーズへ進む
  const handleConfirmBets = () => {
    playClickSound(soundEnabled);
    setPhase('parent_turn');
    setParentRollCount(0);
    setParentYaku(null);
    setActiveDisplayDice([1, 1, 1]);
    setMessage(`親【${currentParent.name}】の手番です。サイコロを振って勝負する役を決めてください（最大3回）。`);
  };

  // 汎用ダイスロール処理
  const executeDiceRoll = (callback: (dice: [number, number, number], yaku: YakuResult) => void) => {
    if (isRolling) return;
    setIsRolling(true);
    playRollSound(soundEnabled);

    const duration = 600;
    rollIntervalRef.current = window.setInterval(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const d3 = Math.floor(Math.random() * 6) + 1;
      setActiveDisplayDice([d1, d2, d3]);
    }, 60);

    setTimeout(() => {
      if (rollIntervalRef.current) {
        clearInterval(rollIntervalRef.current);
      }
      const finalDice: [number, number, number] = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      setActiveDisplayDice(finalDice);
      const evaluated = evaluateChinchiro(finalDice);
      setIsRolling(false);
      playResultSound(soundEnabled, evaluated.category);
      callback(finalDice, evaluated);
    }, duration);
  };

  // 親がサイコロを振る
  const handleParentRoll = () => {
    const nextRollCount = parentRollCount + 1;
    setParentRollCount(nextRollCount);

    executeDiceRoll((finalDice, evaluated) => {
      setParentDice(finalDice);
      setParentYaku(evaluated);

      // 役が出た場合 (役なし以外)、または3回振った場合は役確定
      if (evaluated.category !== 'menashi' || nextRollCount >= 3) {
        setMessage(
          `親【${currentParent.name}】の役は【${evaluated.name}】に確定しました！続いて子がサイコロを振ります。`
        );
        // 子の手番へ進む
        setTimeout(() => {
          setPhase('child_turn');
          setCurrentChildIndex(0);
          setCurrentChildRollCount(0);
          setCurrentChildYaku(null);
          const firstChild = players.find((p) => p.id === childTurnQueue[0]);
          if (firstChild) {
            setMessage(`子【${firstChild.name}】の手番です（賭け金: ${bets[firstChild.id]}点）。親に勝てる役を出しましょう！`);
          }
        }, 1300);
      } else {
        setMessage(`出目は役なし（目なし）でした。残り ${3 - nextRollCount} 回振ることができます。`);
      }
    });
  };

  // 子がサイコロを振る
  const handleChildRoll = () => {
    if (!currentChild || !parentYaku) return;

    const nextRollCount = currentChildRollCount + 1;
    setCurrentChildRollCount(nextRollCount);

    executeDiceRoll((finalDice, evaluated) => {
      setCurrentChildDice(finalDice);
      setCurrentChildYaku(evaluated);

      // 役が出た場合 (役なし以外)、または3回振った場合は役確定
      if (evaluated.category !== 'menashi' || nextRollCount >= 3) {
        const betAmount = bets[currentChild.id] || 100;
        const outcome = calculateBattleOutcome(parentYaku, evaluated, betAmount);

        const battleResult: ChildBattleResult = {
          playerId: currentChild.id,
          playerName: currentChild.name,
          bet: betAmount,
          dice: finalDice,
          yaku: evaluated,
          rollAttempts: nextRollCount,
          outcome: outcome.outcome,
          amountWonOrLost: outcome.amountWonOrLost,
        };

        setRoundBattleResults((prev) => [...prev, battleResult]);

        let outcomeText = '';
        if (outcome.outcome === 'win') {
          outcomeText = `【${currentChild.name}】の勝ち！親から ${outcome.amountWonOrLost}点 を獲得！`;
        } else if (outcome.outcome === 'lose') {
          outcomeText = `【${currentChild.name}】の負け…親へ ${Math.abs(outcome.amountWonOrLost)}点 を支払います。`;
        } else {
          outcomeText = `引き分け！点数の移動はありません。`;
        }
        setMessage(`子【${currentChild.name}】の役: 【${evaluated.name}】！ ${outcomeText}`);

        // 次の子またはラウンド終了へ
        setTimeout(() => {
          const nextIndex = currentChildIndex + 1;
          if (nextIndex < childTurnQueue.length) {
            setCurrentChildIndex(nextIndex);
            setCurrentChildRollCount(0);
            setCurrentChildYaku(null);
            const nextChild = players.find((p) => p.id === childTurnQueue[nextIndex]);
            if (nextChild) {
              setMessage(
                `次は子【${nextChild.name}】の手番です（賭け金: ${bets[nextChild.id]}点）。`
              );
            }
          } else {
            // 子全員との勝負が終了！精算してラウンド結果画面へ
            finishRound([...roundBattleResults, battleResult]);
          }
        }, 1700);
      } else {
        setMessage(`出目は役なし（目なし）でした。残り ${3 - nextRollCount} 回振ることができます。`);
      }
    });
  };

  // ラウンド終了・チップ精算処理
  const finishRound = (results: ChildBattleResult[]) => {
    let parentNetProfit = 0;

    const updatedPlayers = players.map((player) => {
      if (player.id === currentParent.id) {
        // 親の収支は子の勝ち負けの合計の逆
        // (子が勝ったら親が払う(-)、子が負けたら親がもらう(+))
        return { ...player };
      }
      const childRes = results.find((r) => r.playerId === player.id);
      if (childRes) {
        const diff = childRes.amountWonOrLost;
        parentNetProfit -= diff; // 親の損益
        return {
          ...player,
          chips: Math.max(0, player.chips + diff),
        };
      }
      return player;
    });

    // 親のチップを更新
    const finalPlayers = updatedPlayers.map((player) => {
      if (player.id === currentParent.id) {
        return {
          ...player,
          chips: Math.max(0, player.chips + parentNetProfit),
        };
      }
      return player;
    });

    setPlayers(finalPlayers);
    setPhase('round_result');
    setMessage(`子全員との勝負が終了しました！精算結果を確認してください。`);
  };

  // 次の親へ交代
  const handleNextParent = () => {
    playClickSound(soundEnabled);
    const nextParentTurns = parentTurnCount + 1;
    setParentTurnCount(nextParentTurns);

    // 全員に親が回ったらゲーム終了
    if (nextParentTurns >= players.length) {
      setPhase('game_over');
      setMessage(`参加者全員に親が回りました！ゲーム終了です！`);
    } else {
      const nextIndex = (parentIndex + 1) % players.length;
      startRoundWithParent(nextIndex);
    }
  };

  // CPUの自動手番処理
  useEffect(() => {
    if (isRolling) return;

    // 親がCPUで親のサイコロフェーズの場合
    if (phase === 'parent_turn' && currentParent.isCpu) {
      const timer = setTimeout(() => {
        handleParentRoll();
      }, 1000);
      return () => clearTimeout(timer);
    }

    // 子がCPUで子のサイコロフェーズの場合
    if (phase === 'child_turn' && currentChild && currentChild.isCpu) {
      const timer = setTimeout(() => {
        handleChildRoll();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, isRolling, currentParent, currentChild, parentRollCount, currentChildRollCount]);

  // プレイヤー人数の変更 (設定画面)
  const setPlayerCount = (count: number) => {
    playClickSound(soundEnabled);
    const newPlayers: Player[] = [
      { id: 'p1', name: 'あなた (P1)', isCpu: false, chips: 1000, avatarColor: 'bg-blue-600' },
      { id: 'p2', name: 'CPU 太郎 (P2)', isCpu: true, chips: 1000, avatarColor: 'bg-purple-600' },
    ];
    if (count >= 3) {
      newPlayers.push({ id: 'p3', name: 'CPU 花子 (P3)', isCpu: true, chips: 1000, avatarColor: 'bg-emerald-600' });
    }
    if (count >= 4) {
      newPlayers.push({ id: 'p4', name: 'CPU 次郎 (P4)', isCpu: true, chips: 1000, avatarColor: 'bg-amber-600' });
    }
    setPlayers(newPlayers);
  };

  // プレイヤーのCPU/人間切り替え
  const togglePlayerCpu = (id: string) => {
    playClickSound(soundEnabled);
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isCpu: !p.isCpu } : p))
    );
  };

  return (
    <div className="flex flex-col h-full w-full justify-between overflow-y-auto pb-4">
      {/* 1. 設定画面 (SETUP) */}
      {phase === 'setup' && (
        <div className="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-200/80">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg text-neutral-900">チンチロリン対戦設定</h3>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                2人以上で行われ、親と子が順番にサイコロを振って点数を競い合います。全員に親が回ったら1ゲーム終了です。
              </p>

              {/* 人数選択 */}
              <div className="mt-4">
                <label className="text-xs font-bold text-neutral-700 block mb-2">参加人数</label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((cnt) => (
                    <button
                      key={cnt}
                      onClick={() => setPlayerCount(cnt)}
                      className={`py-2 px-3 rounded-xl font-bold text-sm border transition-colors ${
                        players.length === cnt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {cnt}人対戦
                    </button>
                  ))}
                </div>
              </div>

              {/* 参加メンバー一覧 */}
              <div className="mt-4">
                <label className="text-xs font-bold text-neutral-700 block mb-2">
                  プレイヤー一覧 (タップしてCPU/手動操作を切替)
                </label>
                <div className="space-y-2">
                  {players.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-neutral-400">
                          #{idx + 1}
                        </span>
                        <div className={`w-8 h-8 rounded-full ${p.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                          {p.isCpu ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-neutral-800">{p.name}</div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Coins className="w-3 h-3 text-amber-500" />
                            <span>所持: {p.chips}点</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => togglePlayerCpu(p.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${
                          p.isCpu
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {p.isCpu ? 'CPU自動' : '手動操作'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ルール要約カード */}
            <div className="bg-indigo-50/70 rounded-2xl p-3.5 border border-indigo-100 text-xs text-indigo-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>対戦ルール早見</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-indigo-800/90 text-[11px]">
                <li>親はサイコロを最大3回振り、役が出たらその役で決定（親の権利パスも可能）。</li>
                <li>子が一人ずつサイコロを振り、親より強い役なら勝ち、弱いなら負け。</li>
                <li>子全員と勝負したら親が左隣に交代し、全員に親が回ったら1ゲーム終了！</li>
              </ul>
            </div>
          </div>

          {/* ゲーム開始ボタン */}
          <div className="mt-4">
            <button
              onClick={startGame}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Dices className="w-6 h-6" />
              <span>ゲームを開始する</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ベット画面 (BETTING) */}
      {phase === 'betting' && (
        <div className="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* 親アナウンス */}
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-amber-700 font-bold">現在の親</div>
                  <div className="text-base font-bold text-amber-950">{currentParent.name}</div>
                </div>
              </div>

              {/* 親の権利パスボタン */}
              <button
                id="pass-parent-button"
                onClick={handlePassParent}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                title="親の権利を左隣の人にパスします"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>親をパスする</span>
              </button>
            </div>

            {/* 子の賭け金設定エリア */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-sm text-neutral-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>子の賭け金を設定</span>
                </div>
                <span className="text-xs text-neutral-400">親以外の全員が設定</span>
              </div>

              <div className="space-y-3">
                {players
                  .filter((_, idx) => idx !== parentIndex)
                  .map((child) => (
                    <div
                      key={child.id}
                      className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/70"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${child.avatarColor}`} />
                          <span className="text-sm font-bold text-neutral-800">{child.name}</span>
                          {child.isCpu && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                              CPU
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-neutral-500">所持: {child.chips}点</span>
                      </div>

                      {/* 賭け金ボタン */}
                      <div className="flex items-center gap-1.5">
                        {[50, 100, 200, 300].map((amt) => {
                          const isSelected = bets[child.id] === amt;
                          const disabled = child.chips < amt;
                          return (
                            <button
                              key={amt}
                              disabled={disabled}
                              onClick={() => {
                                playClickSound(soundEnabled);
                                setBets((prev) => ({ ...prev, [child.id]: amt }));
                              }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : disabled
                                  ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                            >
                              {amt}点
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 親のサイコロへ進むボタン */}
          <div className="mt-4">
            <button
              id="confirm-bets-button"
              onClick={handleConfirmBets}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>賭け金を決定して親の勝負へ</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. 親のサイコロフェーズ (PARENT_TURN) & 4. 子のサイコロフェーズ (CHILD_TURN) */}
      {(phase === 'parent_turn' || phase === 'child_turn') && (
        <div className="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col justify-between">
          <div className="space-y-3">
            {/* 進行ヘッダーバッジ */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-neutral-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-neutral-100 text-neutral-600">
                  親の周回 {parentTurnCount + 1}/{players.length}
                </span>
                <span className="text-xs font-semibold text-neutral-600">
                  {phase === 'parent_turn' ? '親の手番' : `子の手番 (${currentChildIndex + 1}/${childTurnQueue.length})`}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-amber-600 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>親: {currentParent.name}</span>
              </div>
            </div>

            {/* 対戦カード（親の役 vs 今回の子） */}
            <div className="grid grid-cols-2 gap-2">
              {/* 親の情報 */}
              <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>親: {currentParent.name}</span>
                  </span>
                  <span className="text-[10px] text-amber-600 font-mono">
                    {phase === 'parent_turn' ? `振った回数: ${parentRollCount}/3` : '役決定'}
                  </span>
                </div>
                <div className="text-center py-1">
                  {parentYaku ? (
                    <div>
                      <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${parentYaku.badgeColor}`}>
                        {parentYaku.name}
                      </span>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        [{parentDice.join('-')}]
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-800/60 font-medium">振るのを待機中</span>
                  )}
                </div>
              </div>

              {/* 現在の手番の子の情報 */}
              <div className="bg-blue-50/80 rounded-2xl p-3 border border-blue-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-600" />
                    <span>子: {currentChild ? currentChild.name : '子の番待ち'}</span>
                  </span>
                  {currentChild && (
                    <span className="text-[10px] text-blue-600 font-mono">
                      賭: {bets[currentChild.id]}点
                    </span>
                  )}
                </div>
                <div className="text-center py-1">
                  {currentChildYaku ? (
                    <div>
                      <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${currentChildYaku.badgeColor}`}>
                        {currentChildYaku.name}
                      </span>
                      <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        [{currentChildDice.join('-')}]
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-blue-800/60 font-medium">
                      {phase === 'parent_turn' ? '親の役決定待ち' : `振った回数: ${currentChildRollCount}/3`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ダイス描画エリア */}
            <div className="flex flex-col items-center justify-center p-5 bg-white/70 backdrop-blur-xs rounded-3xl border border-neutral-200/80 shadow-sm">
              <div className="text-xs font-bold text-neutral-500 mb-3">
                {phase === 'parent_turn'
                  ? `【親】${currentParent.name} のサイコロ`
                  : `【子】${currentChild?.name} のサイコロ`}
              </div>
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                <Dice value={activeDisplayDice[0]} isRolling={isRolling} delay={0} size="md" />
                <Dice value={activeDisplayDice[1]} isRolling={isRolling} delay={0.08} size="md" />
                <Dice value={activeDisplayDice[2]} isRolling={isRolling} delay={0.16} size="md" />
              </div>

              {/* メッセージ表示 */}
              <div className="mt-4 text-center px-2">
                <p className="text-xs sm:text-sm font-bold text-neutral-800 leading-snug">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* 下部アクションボタン */}
          <div className="mt-4">
            {phase === 'parent_turn' && (
              <button
                id="parent-roll-button"
                onClick={handleParentRoll}
                disabled={isRolling || currentParent.isCpu}
                className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                  isRolling || currentParent.isCpu
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 cursor-pointer'
                }`}
              >
                <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
                <span>
                  {currentParent.isCpu
                    ? '親(CPU)が振っています…'
                    : `親がサイコロを振る (${parentRollCount + 1}/3回目)`}
                </span>
              </button>
            )}

            {phase === 'child_turn' && currentChild && (
              <button
                id="child-roll-button"
                onClick={handleChildRoll}
                disabled={isRolling || currentChild.isCpu}
                className={`w-full py-4 text-white font-bold text-lg rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 ${
                  isRolling || currentChild.isCpu
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer'
                }`}
              >
                <Dices className={`w-6 h-6 ${isRolling ? 'animate-spin' : ''}`} />
                <span>
                  {currentChild.isCpu
                    ? `${currentChild.name}(CPU)が振っています…`
                    : `子がサイコロを振る (${currentChildRollCount + 1}/3回目)`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. ラウンド結果画面 (ROUND_RESULT) */}
      {phase === 'round_result' && (
        <div className="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-neutral-200/80">
              <div className="flex items-center justify-between mb-3 border-b border-neutral-100 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-base text-neutral-900">ラウンド精算結果</h3>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  周回 {parentTurnCount + 1}/{players.length}
                </span>
              </div>

              {/* 親の出目 */}
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 mb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-700 font-bold">親: {currentParent.name}</span>
                  <div className="font-bold text-sm text-neutral-800">
                    役: {parentYaku?.name}
                  </div>
                </div>
                <div className="text-xs font-mono bg-white px-2 py-1 rounded-md border border-amber-200">
                  出目: {parentDice.join('-')}
                </div>
              </div>

              {/* 各子との勝敗一覧 */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-neutral-600">各子との勝負</div>
                {roundBattleResults.map((res) => (
                  <div
                    key={res.playerId}
                    className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-neutral-800">{res.playerName}</span>
                        <span className="text-xs text-neutral-400 font-mono">(賭: {res.bet}点)</span>
                      </div>
                      <div className="text-xs text-neutral-600 mt-0.5">
                        役: <span className="font-semibold text-neutral-800">{res.yaku.name}</span> [{res.dice.join('-')}]
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          res.outcome === 'win'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : res.outcome === 'lose'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {res.outcome === 'win' ? '子の勝ち' : res.outcome === 'lose' ? '子の負け' : '引き分け'}
                      </span>
                      <div
                        className={`text-xs font-bold font-mono mt-0.5 ${
                          res.amountWonOrLost > 0
                            ? 'text-emerald-600'
                            : res.amountWonOrLost < 0
                            ? 'text-rose-600'
                            : 'text-neutral-500'
                        }`}
                      >
                        {res.amountWonOrLost > 0
                          ? `+${res.amountWonOrLost}点`
                          : res.amountWonOrLost < 0
                          ? `${res.amountWonOrLost}点`
                          : '±0点'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 現在のチップ保有ランキング */}
              <div className="mt-4 pt-3 border-t border-neutral-100">
                <div className="text-xs font-bold text-neutral-500 mb-2">現在のチップ状況</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...players]
                    .sort((a, b) => b.chips - a.chips)
                    .map((p, idx) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-xl bg-neutral-100/70 border border-neutral-200/50 text-xs"
                      >
                        <div className="font-bold text-neutral-700 truncate">
                          {idx + 1}位 {p.name}
                        </div>
                        <div className="font-mono font-bold text-amber-600">{p.chips}点</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* 次の親へ交代ボタン */}
          <div className="mt-4">
            <button
              id="next-parent-button"
              onClick={handleNextParent}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>{parentTurnCount + 1 >= players.length ? '最終結果へ' : '親を交代して次へ'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 6. 最終ゲーム終了画面 (GAME_OVER) */}
      {phase === 'game_over' && (
        <div className="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-200/80 text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center mb-3 shadow-inner">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">ゲーム終了！</h2>
              <p className="text-xs text-neutral-500 mt-1">
                参加者全員に親が回りました。最終成績発表です！
              </p>

              {/* 最終順位ランキング */}
              <div className="mt-6 space-y-2 text-left">
                {[...players]
                  .sort((a, b) => b.chips - a.chips)
                  .map((p, idx) => {
                    const isWinner = idx === 0;
                    const diff = p.chips - 1000;
                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between ${
                          isWinner
                            ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                            : 'bg-neutral-50 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              isWinner
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isWinner && <Sparkles className="w-4 h-4 text-amber-500" />}
                            </div>
                            <div className="text-xs text-neutral-400">
                              初期値比:{' '}
                              <span
                                className={`font-mono font-bold ${
                                  diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-neutral-500'
                                }`}
                              >
                                {diff > 0 ? `+${diff}` : diff}点
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono font-bold text-base text-neutral-900">
                          {p.chips}点
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* もう一度遊ぶボタン */}
          <div className="mt-4">
            <button
              onClick={() => {
                playClickSound(soundEnabled);
                setPlayers(DEFAULT_PLAYERS);
                setPhase('setup');
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>もう一度最初から遊ぶ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
