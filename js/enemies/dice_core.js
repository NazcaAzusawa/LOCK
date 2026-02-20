// ========================================
// ダイス・コア（敵7）
// 赤は確率でダメージ、青で確率を上げる
// ========================================

import { TILE } from '../constants.js';

export const diceCore = {
  name: 'ダイス・コア',
  image: 'img/enemies/dice_core.png',
  hp: 5,
  patternX: 'chaos',
  patternY: 'doubleSine',
  coeffX: 1.5,
  coeffY: 1.8,

  // 色の説明
  colorLegend: [
    { color: 'RED',  description: '現在の確率でダメージ1（初期25%）' },
    { color: 'BLUE', description: '赤のヒット確率を+25%（ターン内重複可、ターン跨ぎでリセット）' }
  ],

  rules: {
    [TILE.RED]: {
      limit: 99,
      onHit: (context) => {
        const chance = 0.25 + context.getHitChanceBonus();
        const clamped = Math.min(chance, 1.0);
        if (Math.random() < clamped) {
          context.enemyHP -= 1;
          context.showMessage(`HIT! (${Math.round(clamped * 100)}%) -1`);
        } else {
          context.showMessage(`MISS (${Math.round(clamped * 100)}%)`);
        }
      }
    },
    [TILE.BLUE]: {
      limit: 3,
      onHit: (context) => {
        context.addHitChanceBonus(0.25);
        const total = Math.min(0.25 + context.getHitChanceBonus(), 1.0);
        context.showMessage(`BOOSTED! Hit: ${Math.round(total * 100)}%`);
      }
    }
  },

  // 中央に青（確率ブースト）、四隅に赤（攻撃目標）
  layouts: [
    { shape: 'circle', x: 30, y: 30, r: 12, type: TILE.BLUE  },
    { shape: 'circle', x: 10, y: 10, r: 8,  type: TILE.RED   },
    { shape: 'circle', x: 50, y: 10, r: 8,  type: TILE.RED   },
    { shape: 'circle', x: 10, y: 50, r: 8,  type: TILE.RED   },
    { shape: 'circle', x: 50, y: 50, r: 8,  type: TILE.RED   }
  ]
};
