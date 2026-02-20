// ========================================
// フロスト・アイ（敵4）
// ========================================

import { TILE } from '../constants.js';

export const frostEye = {
  name: 'フロスト・アイ',
  hp: 1,
  patternX: 'chaos',
  patternY: 'doubleSine',
  coeffX: 2.2,
  coeffY: 1.8,

  // 色の説明
  colorLegend: [
    { color: 'CYAN', description: 'このターン中のカーソル速度が0.8倍になる' },
    { color: 'RED', description: '1ダメージ（即死）' }
  ],

  // この敵における各色の効果
  rules: {
    [TILE.CYAN]: {
      limit: 99,
      onHit: (context) => {
        context.setSpeedMultiplier(0.8);
        context.showMessage('SLOWED!');
      }
    },
    [TILE.RED]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('HIT! -1');
      }
    }
  },

  // 外側: 水色の大きな円、中心: 赤い小さな円
  layouts: [
    { shape: 'circle', x: 30, y: 30, r: 20, type: TILE.CYAN },
    { shape: 'circle', x: 30, y: 30, r: 5,  type: TILE.RED  }
  ]
};
