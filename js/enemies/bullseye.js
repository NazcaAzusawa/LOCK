// ========================================
// ブルズ・アイ（敵3）
// ========================================

import { TILE } from '../constants.js';

export const bullseye = {
  name: 'ブルズ・アイ',
  hp: 10,
  patternX: 'zigzag',
  patternY: 'bounce',
  coeffX: 0.8,
  coeffY: 0.8,

  // この敵における各色の効果（的当て）
  rules: {
    [TILE.YELLOW]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 4;
        context.showMessage('BULLSEYE! -4');
      }
    },
    [TILE.RED]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 3;
        context.showMessage('HIT! -3');
      }
    },
    [TILE.BLUE]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 2;
        context.showMessage('HIT! -2');
      }
    },
    [TILE.BLACK]: {
      limit: 99,
      onHit: (context) => {
        context.enemyHP -= 1;
        context.showMessage('HIT! -1');
      }
    }
  },

  // ドット絵で的を描画
  layouts: [
    {
      x: 20,
      y: 20,
      
      // パレット定義（文字と色IDのマッピング）
      palette: {
        '.': TILE.EMPTY,
        'K': TILE.BLACK,  // 黒 (1ダメ)
        'B': TILE.BLUE,   // 青 (2ダメ)
        'R': TILE.RED,    // 赤 (3ダメ)
        'Y': TILE.YELLOW  // 黄 (4ダメ)
      },

      // 設計図（ドット絵で円を描く）
      blueprint: [
        ".......KKKKK.......",
        ".....KKBBBBBKK.....",
        "....KBBRRRRRBBK....",
        "...KBBRRRRRRRBBK...",
        "..KBBRRYYYYYRRBBK..",
        "..KBBRYYYYYYYRRBBK.",
        ".KBBRRYYYYYYYRRBBK.",
        ".KBBRYYYYYYYYYRBBK.",
        ".KBBRYYYYYYYYYRBBK.",
        ".KBBRYYYYYYYYYRBBK.",
        ".KBBRYYYYYYYYYRBBK.",
        ".KBBRYYYYYYYYYRBBK.",
        ".KBBRRYYYYYYYRRBBK.",
        "..KBBRYYYYYYYRRBBK.",
        "..KBBRRYYYYYRRBBK..",
        "...KBBRRRRRRRBBK...",
        "....KBBRRRRRBBK....",
        ".....KKBBBBBKK.....",
        ".......KKKKK......."
      ]
    }
  ]
};
