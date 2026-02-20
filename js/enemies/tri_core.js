// ========================================
// トライ・コア（敵2）
// ========================================

import { TILE } from '../constants.js';

export const triCore = {
  name: 'トライ・コア',
  image: 'img/enemies/tri_core.png',
  hp: 3,
  isRegen: true, // 全回復ギミック持ち
  patternX: 'cos',
  patternY: 'sine',
  coeffX: 1.5,
  coeffY: 1.5,

  // 敵の特殊効果
  specialAbilities: [
    '全コアを破壊すると次ターン冒頭に全回復する'
  ],

  // 色の説明
  colorLegend: [
    { color: 'RED', description: 'コア破壊（1ダメージ）。1ターンに1度のみ。' },
    { color: 'BLUE', description: 'コア破壊（1ダメージ）。1ターンに1度のみ。' },
    { color: 'GREEN', description: 'コア破壊（1ダメージ）。1ターンに1度のみ。' }
  ],

  // この敵では全色がコア破壊（1ダメージ）
  rules: {
    [TILE.GREEN]: {
      limit: 1,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('CORE BROKEN!');
      }
    },
    [TILE.BLUE]: {
      limit: 1,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('CORE BROKEN!');
      }
    },
    [TILE.RED]: {
      limit: 1,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('CORE BROKEN!');
      }
    }
  },

  // 3つのコアを配置
  layouts: [
    { x: 25, y: 5, w: 10, h: 10, type: TILE.RED },
    { x: 5, y: 40, w: 10, h: 10, type: TILE.BLUE },
    { x: 45, y: 40, w: 10, h: 10, type: TILE.GREEN }
  ]
};
