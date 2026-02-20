// ========================================
// アンプ・コア（敵6）
// 黄色に当たるたびに敵の次の攻撃が倍増する
// 3タップで最大 1→2→4→8 ダメージ
// ========================================

import { TILE } from '../constants.js';

export const ampCore = {
  name: 'アンプ・コア',
  image: 'img/enemies/amp_core.png',
  hp: 1,
  patternX: 'center',
  patternY: 'center',
  coeffX: 1.4,
  coeffY: 1.2,

  // 色の説明
  colorLegend: [
    { color: 'RED',    description: '1ダメージ（即死）' },
    { color: 'YELLOW', description: '敵の次の攻撃を倍にする（最大3回で×8）' }
  ],

  rules: {
    [TILE.RED]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('CORE HIT! -1');
      }
    },
    [TILE.YELLOW]: {
      limit: 3,
      onHit: (context) => {
        const next = context.getEnemyAttack() * 2;
        context.setEnemyAttack(next);
        context.showMessage(`AMPLIFIED! Enemy ATK ×${next}`);
      }
    }
  },

  // 外側が黄色（危険地帯）、中心の小さな円が赤（トドメ）
  layouts: [
    { shape: 'circle', x: 30, y: 30, r: 22, type: TILE.YELLOW },
    { shape: 'circle', x: 30, y: 30, r: 5,  type: TILE.RED    }
  ]
};
