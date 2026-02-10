// ========================================
// プロト・ワン（敵1）
// ========================================

import { TILE } from '../constants.js';

export const protoOne = {
  name: 'プロト・ワン',
  hp: 10,
  patternX: 'sine',
  patternY: 'linear',
  coeffX: 1.0,
  coeffY: 0.1,
  
  // この敵における各色の効果定義
  rules: {
    [TILE.GREEN]: {
      limit: 99,
      onHit: (context) => {
        // 緑 = ダメージ1（旧ATTACK相当）
        context.enemyHP -= 1;
        context.showMessage('HIT! -1');
      }
    },
    [TILE.BLUE]: {
      limit: 1,
      onHit: (context) => {
        // 青 = シールド追加（旧SHIELD相当）
        context.playerShield++;
        context.showMessage('SHIELD UP!');
      }
    }
  },
  
  // ドット絵レイアウト
  layouts: [
    { x: 0, y: 0, w: 20, h: 60, type: TILE.BLUE },
    { x: 20, y: 0, w: 40, h: 60, type: TILE.GREEN }
  ]
};
