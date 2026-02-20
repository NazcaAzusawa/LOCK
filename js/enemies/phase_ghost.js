// ========================================
// フェイズ・ゴースト（敵5）
// ダメージを受けるたびに盤面が変化する
// ========================================

import { TILE } from '../constants.js';

export const phaseGhost = {
  name: 'フェイズ・ゴースト',
  hp: 3,
  patternX: 'pendulum',
  patternY: 'chaos',
  coeffX: 2.0,
  coeffY: 1.6,

  // 色の説明
  colorLegend: [
    { color: 'RED',  description: '1ダメージ（盤面が変化する）' },
    { color: 'GRAY', description: 'このターンの残り弾数を0にリセットする' }
  ],

  // 各色の効果
  rules: {
    [TILE.RED]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('HIT! -1');
      }
    },
    [TILE.GRAY]: {
      limit: 99,
      onHit: (context) => {
        context.setTapCount(0);
        context.showMessage('JAMMED! 0 shots');
      }
    }
  },

  // 3フェーズの盤面（ダメージごとに次のフェーズへ）
  // フェーズ0: 赤が大きく当てやすい、灰色は少ない
  // フェーズ1: 赤が中程度、灰色が増える
  // フェーズ2: 赤が小さく当てにくい、灰色がほぼ全面
  phaseLayouts: [
    // ─── フェーズ 0 ───
    [
      { shape: 'circle', x: 30, y: 30, r: 22, type: TILE.GRAY },
      { shape: 'circle', x: 30, y: 30, r: 15, type: TILE.RED  }
    ],
    // ─── フェーズ 1 ───
    [
      { shape: 'circle', x: 30, y: 30, r: 24, type: TILE.GRAY },
      { shape: 'circle', x: 30, y: 30, r: 9,  type: TILE.RED  },
      // 引っ掛け用灰色の小島
      { shape: 'circle', x: 15, y: 15, r: 5,  type: TILE.GRAY },
      { shape: 'circle', x: 45, y: 15, r: 5,  type: TILE.GRAY },
      { shape: 'circle', x: 15, y: 45, r: 5,  type: TILE.GRAY },
      { shape: 'circle', x: 45, y: 45, r: 5,  type: TILE.GRAY }
    ],
    // ─── フェーズ 2 ───
    [
      { shape: 'circle', x: 30, y: 30, r: 28, type: TILE.GRAY },
      { shape: 'circle', x: 30, y: 30, r: 4,  type: TILE.RED  },
      // 四隅にも灰色
      { shape: 'circle', x: 10, y: 10, r: 8,  type: TILE.GRAY },
      { shape: 'circle', x: 50, y: 10, r: 8,  type: TILE.GRAY },
      { shape: 'circle', x: 10, y: 50, r: 8,  type: TILE.GRAY },
      { shape: 'circle', x: 50, y: 50, r: 8,  type: TILE.GRAY }
    ]
  ]
};
