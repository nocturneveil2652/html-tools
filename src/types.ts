export type TabType = 'counter' | 'chinchiro';

export type YakuCategory =
  | 'pinzoro'   // ピンゾロ (1-1-1)
  | 'zorome'    // ゾロ目 (2-2-2 ~ 6-6-6)
  | 'shigoro'   // シション / シゴロ (4-5-6)
  | 'normal'    // 通常の目 (出目: 1~6)
  | 'menashi'   // 役なし
  | 'hifumi';   // ヒフミ (1-2-3)

export interface YakuResult {
  category: YakuCategory;
  name: string;
  subName?: string;
  description: string;
  rank: number; // 役の強さランク (高いほど強い)
  pointValue?: number; // 通常の目の場合 1~6
  badgeColor: string;
  isSpecial: boolean;
  multiplier: number; // 倍率 (ピンゾロ: 5, ゾロ目: 3, シション: 2, その他: 1)
}

export interface RollHistoryItem {
  id: string;
  dice: [number, number, number];
  result: YakuResult;
  timestamp: Date;
}

export interface Player {
  id: string;
  name: string;
  isCpu: boolean;
  chips: number;
  avatarColor: string;
}

export type GamePhase =
  | 'setup'         // 参加人数や設定
  | 'betting'       // 子の賭け金設定
  | 'parent_turn'   // 親のサイコロ（最大3回）
  | 'child_turn'    // 子のサイコロ（最大3回、一人ずつ）
  | 'round_result'  // 当該ラウンドの精算と結果
  | 'game_over';    // 全員に親が回ってゲーム終了

export interface ChildBattleResult {
  playerId: string;
  playerName: string;
  bet: number;
  dice: [number, number, number];
  yaku: YakuResult;
  rollAttempts: number;
  outcome: 'win' | 'lose' | 'draw';
  amountWonOrLost: number; // プラスは子の勝ち、マイナスは子の負け
}
