// ========================================
// ブラインド・ゴースト（敵10）
// 上半分はブラーがかかりカーソルが見えない
// 赤（上半分・5ダメ）か黄（下半分・1ダメ）を選べ
// ========================================

import { TILE } from '../constants.js';

export const blindGhost = {
  name: 'ブラインド・ゴースト',
  hp: 12,
  hideCursorUpperHalf: true,
  patternX: 'chaos',
  patternY: 'zigzag',
  coeffX: 1.6,
  coeffY: 0.9,

  // 敵の特殊効果
  specialAbilities: [
    '上半分はカーソルが見えない'
  ],

  // 色の説明
  colorLegend: [
    { color: 'RED',    description: '5ダメージ（上半分・カーソル不可視）' },
    { color: 'YELLOW', description: '1ダメージ（下半分・カーソル可視）'  }
  ],

  rules: {
    [TILE.RED]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 5;
        context.showMessage('BLIND HIT! -5');
      }
    },
    [TILE.YELLOW]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('HIT! -1');
      }
    }
  },

  // 上半分：赤（高リターン・視認不可）
  // 下半分：黄（低リターン・視認可）
  layouts: [
    { shape: 'circle', x: 20, y: 15, r: 11, type: TILE.RED    },
    { shape: 'circle', x: 40, y: 15, r: 11, type: TILE.RED    },
    { shape: 'circle', x: 30, y: 10, r:  6, type: TILE.RED    },
    { shape: 'circle', x: 12, y: 40, r:  9, type: TILE.YELLOW },
    { shape: 'circle', x: 30, y: 45, r:  9, type: TILE.YELLOW },
    { shape: 'circle', x: 48, y: 40, r:  9, type: TILE.YELLOW }
  ]
};
