import { YakuResult } from '../types';

export function evaluateChinchiro(dice: [number, number, number]): YakuResult {
  const sorted = [...dice].sort((a, b) => a - b) as [number, number, number];
  const [d1, d2, d3] = sorted;

  // 1. ピンゾロ (1-1-1)
  if (d1 === 1 && d2 === 1 && d3 === 1) {
    return {
      category: 'pinzoro',
      name: 'ピンゾロ',
      subName: '1-1-1 (最強役)',
      description: '奇跡の出目！最高の勝ち役（5倍払い）です。',
      rank: 100,
      badgeColor: 'bg-amber-500 text-white shadow-amber-500/30',
      isSpecial: true,
      multiplier: 5,
    };
  }

  // 2. ゾロ目 (2-2-2, 3-3-3, 4-4-4, 5-5-5, 6-6-6)
  if (d1 === d2 && d2 === d3) {
    return {
      category: 'zorome',
      name: `${d1}のゾロ目`,
      subName: `${d1}-${d1}-${d1} (大勝ち)`,
      description: `3つすべて揃った強力な役（3倍払い）です。`,
      rank: 80 + d1,
      badgeColor: 'bg-indigo-600 text-white shadow-indigo-500/30',
      isSpecial: true,
      multiplier: 3,
    };
  }

  // 3. シション / シゴロ (4-5-6)
  if (d1 === 4 && d2 === 5 && d3 === 6) {
    return {
      category: 'shigoro',
      name: 'シション（シゴロ）',
      subName: '4-5-6 (強役)',
      description: '縁起の良い上がり目！勝ち役（2倍払い）です。',
      rank: 70,
      badgeColor: 'bg-emerald-600 text-white shadow-emerald-500/30',
      isSpecial: true,
      multiplier: 2,
    };
  }

  // 4. ヒフミ (1-2-3)
  if (d1 === 1 && d2 === 2 && d3 === 3) {
    return {
      category: 'hifumi',
      name: 'ヒフミ',
      subName: '1-2-3 (即負け)',
      description: '最も悔しい出目…負け役（2倍払い）です。',
      rank: 1,
      badgeColor: 'bg-rose-600 text-white shadow-rose-500/30',
      isSpecial: true,
      multiplier: 2,
    };
  }

  // 5. 通常の目 (出目: 2つ同じで残りの1つが目)
  let pointValue: number | null = null;
  if (d1 === d2) {
    pointValue = d3;
  } else if (d2 === d3) {
    pointValue = d1;
  }

  if (pointValue !== null) {
    return {
      category: 'normal',
      name: `${pointValue}の目`,
      subName: `出目: ${pointValue}`,
      description: `サイコロ2つが揃い、出目が「${pointValue}」に決まりました。`,
      rank: 10 + pointValue,
      pointValue,
      badgeColor: 'bg-blue-600 text-white shadow-blue-500/20',
      isSpecial: false,
      multiplier: 1,
    };
  }

  // 6. 役なし (目なし)
  return {
    category: 'menashi',
    name: '役なし',
    subName: '目なし',
    description: '3つの目がバラバラで役になりませんでした。',
    rank: 5,
    badgeColor: 'bg-neutral-500 text-white shadow-neutral-400/20',
    isSpecial: false,
    multiplier: 1,
  };
}

/**
 * 親の役と子の役、および子の賭け金から勝敗と移動金額を算出する
 * 戻り値の amountWonOrLost は子が基準（プラスなら子の勝ち、マイナスなら子の負け、0は引き分け）
 */
export function calculateBattleOutcome(
  parentYaku: YakuResult,
  childYaku: YakuResult,
  bet: number
): { outcome: 'win' | 'lose' | 'draw'; amountWonOrLost: number; multiplier: number } {
  if (childYaku.rank > parentYaku.rank) {
    // 子の勝ち
    let mult = childYaku.multiplier;
    // もし親がヒフミ(rank 1)なら親が2倍払い
    if (parentYaku.category === 'hifumi') {
      mult = Math.max(mult, 2);
    }
    return {
      outcome: 'win',
      amountWonOrLost: bet * mult,
      multiplier: mult,
    };
  } else if (childYaku.rank < parentYaku.rank) {
    // 子の負け (親の勝ち)
    let mult = parentYaku.multiplier;
    // もし子がヒフミなら子が2倍払い
    if (childYaku.category === 'hifumi') {
      mult = Math.max(mult, 2);
    }
    return {
      outcome: 'lose',
      amountWonOrLost: -(bet * mult),
      multiplier: mult,
    };
  } else {
    // 引き分け
    return {
      outcome: 'draw',
      amountWonOrLost: 0,
      multiplier: 1,
    };
  }
}
