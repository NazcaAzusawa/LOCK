// ========================================
// ミラー・コア（敵8）
// 攻撃力2、水色で反射しないと倒せない
// 緑＋青＋水色でノーダメ撃破
// ========================================

import { TILE } from '../constants.js';

export const mirrorCore = {
  name: 'ミラー・コア',
  image: 'img/enemies/mirror_core.png',
  hp: 1,
  attackDamage: 2,
  patternX: 'sawtooth',
  patternY: 'zigzag',
  coeffX: 1.1,
  coeffY: 0.9,

  // 敵の特殊効果
  specialAbilities: [
    '基本攻撃力 2（通常の2倍）',
    '水色の反射のみでしかダメージを与えられない'
  ],

  // 色の説明
  colorLegend: [
    { color: 'GREEN', description: '敵の攻撃-1（重複可、ターンごとリセット）' },
    { color: 'BLUE',  description: 'このターン、1以下のダメージを無効化' },
    { color: 'CYAN',  description: '受けるダメージ分を敵に反射（無効化時も無効化前の値を反射）' }
  ],

  rules: {
    [TILE.GREEN]: {
      limit: 2,
      onHit: (context) => {
        context.addAttackReduction(1);
        context.showMessage('WEAKENED! ATK -1');
      }
    },
    [TILE.BLUE]: {
      limit: 1,
      onHit: (context) => {
        context.setShieldThreshold(1);
        context.showMessage('GUARD SET!');
      }
    },
    [TILE.CYAN]: {
      limit: 1,
      onHit: (context) => {
        context.setReflect();
        context.showMessage('REFLECT SET!');
      }
    }
  },

  // 緑・青・水色を横3列に配置（カーソルが横断するとき順に当てられる）
  layouts: [
    { shape: 'circle', x: 10, y: 18, r: 8, type: TILE.GREEN },
    { shape: 'circle', x: 10, y: 42, r: 8, type: TILE.GREEN },
    { shape: 'circle', x: 30, y: 18, r: 8, type: TILE.BLUE  },
    { shape: 'circle', x: 30, y: 42, r: 8, type: TILE.BLUE  },
    { shape: 'circle', x: 50, y: 18, r: 8, type: TILE.CYAN  },
    { shape: 'circle', x: 50, y: 42, r: 8, type: TILE.CYAN  }
  ]
};
