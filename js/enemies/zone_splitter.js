// ========================================
// ゾーン・スプリッター（敵9）
// 最初はカーソルが左半分のみ。緑でゾーン切替。
// 赤＋青を同じターンに当てると5ダメージ。
// 理想ルート：赤→緑→青（1ターン撃破）
// ========================================

import { TILE } from '../constants.js';

export const zoneSplitter = {
  name: 'ゾーン・スプリッター',
  hp: 5,
  initialZone: 'left',
  patternX: 'sawtooth',
  patternY: 'bounce',
  coeffX: 1.2,
  coeffY: 1.0,

  // 色の説明
  colorLegend: [
    { color: 'RED',   description: '1ダメージ（同ターン青と同時なら5ダメージ）' },
    { color: 'BLUE',  description: '1ダメージ（同ターン赤と同時なら5ダメージ）' },
    { color: 'GREEN', description: 'カーソルのX軸ゾーンを左右切替（ターン跨ぎで維持）' }
  ],

  rules: {
    [TILE.RED]: {
      limit: 99,
      onHit: (context) => {
        if (context.getHitColors().has(TILE.BLUE)) {
          // 青と同ターン → コンボ（青の1ダメ分を含めて合計5になるよう+4）
          context.enemyHP -= 4;
          context.showMessage('RED+BLUE COMBO! -5!!');
        } else {
          context.enemyHP -= 1;
          context.showMessage('RED HIT! -1');
        }
      }
    },
    [TILE.BLUE]: {
      limit: 99,
      onHit: (context) => {
        if (context.getHitColors().has(TILE.RED)) {
          // 赤と同ターン → コンボ（赤の1ダメ分を含めて合計5になるよう+4）
          context.enemyHP -= 4;
          context.showMessage('RED+BLUE COMBO! -5!!');
        } else {
          context.enemyHP -= 1;
          context.showMessage('BLUE HIT! -1');
        }
      }
    },
    [TILE.GREEN]: {
      limit: 1,
      onHit: (context) => {
        context.toggleZone();
        context.showMessage('ZONE SWITCHED!');
      }
    }
  },

  // 左半分（col 0–29）に赤＋緑、右半分（col 30–59）に青＋緑
  layouts: [
    // 左ゾーン：赤（大）と緑（小）
    { shape: 'circle', x: 12, y: 20, r: 9,  type: TILE.RED   },
    { shape: 'circle', x: 12, y: 42, r: 9,  type: TILE.RED   },
    { shape: 'circle', x: 24, y: 30, r: 5,  type: TILE.GREEN },
    // 右ゾーン：青（大）と緑（小）
    { shape: 'circle', x: 48, y: 20, r: 9,  type: TILE.BLUE  },
    { shape: 'circle', x: 48, y: 42, r: 9,  type: TILE.BLUE  },
    { shape: 'circle', x: 36, y: 30, r: 5,  type: TILE.GREEN }
  ]
};
