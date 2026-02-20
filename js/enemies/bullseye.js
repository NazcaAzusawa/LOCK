// ========================================
// ブルズ・アイ（敵3）
// ========================================

import { TILE } from '../constants.js';

export const bullseye = {
  name: 'ブルズ・アイ',
  image: 'img/enemies/bullseye.png',
  hp: 10,
  patternX: 'zigzag',
  patternY: 'bounce',
  coeffX: 0.8,
  coeffY: 0.8,

  // 色の説明
  colorLegend: [
    { color: 'YELLOW', description: '4ダメージ' },
    { color: 'RED', description: '3ダメージ' },
    { color: 'BLUE', description: '2ダメージ' },
    { color: 'BLACK', description: '1ダメージ' }
  ],

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
      x: 7,
      y: 7,
      
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
        '                   KKKKKKKKKK                   ',
        '                KKKKKKKKKKKKKKKK                ',
        '             KKKKKKKKKKKKKKKKKKKKKK             ',
        '            KKKKKKKKKKKKKKKKKKKKKKKK            ',
        '          KKKKKKKKKKKKKKKKKKKKKKKKKKKK          ',
        '         KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK         ',
        '        KKKKKKKKKKKKBBBBBBBBKKKKKKKKKKKK        ',
        '       KKKKKKKKKKBBBBBBBBBBBBBBKKKKKKKKKK       ',
        '      KKKKKKKKKBBBBBBBBBBBBBBBBBBKKKKKKKKK      ',
        '     KKKKKKKKBBBBBBBBBBBBBBBBBBBBBBKKKKKKKK     ',
        '    KKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBKKKKKKKK    ',
        '    KKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBBBKKKKKKK    ',
        '   KKKKKKKBBBBBBBBBBBRRRRRRBBBBBBBBBBBKKKKKKK   ',
        '  KKKKKKKBBBBBBBBBRRRRRRRRRRRRBBBBBBBBBKKKKKKK  ',
        '  KKKKKKKBBBBBBBBRRRRRRRRRRRRRRBBBBBBBBKKKKKKK  ',
        '  KKKKKKBBBBBBBBRRRRRRRRRRRRRRRRBBBBBBBBKKKKKK  ',
        ' KKKKKKKBBBBBBBRRRRRRRRRRRRRRRRRRBBBBBBBKKKKKKK ',
        ' KKKKKKBBBBBBBRRRRRRRRRRRRRRRRRRRRBBBBBBBKKKKKK ',
        ' KKKKKKBBBBBBRRRRRRRRRYYYYRRRRRRRRRBBBBBBKKKKKK ',
        'KKKKKKKBBBBBBRRRRRRRYYYYYYYYRRRRRRRBBBBBBKKKKKKK',
        'KKKKKKBBBBBBBRRRRRRYYYYYYYYYYRRRRRRBBBBBBBKKKKKK',
        'KKKKKKBBBBBBRRRRRRRYYYYYYYYYYRRRRRRRBBBBBBKKKKKK',
        'KKKKKKBBBBBBRRRRRRYYYYYYYYYYYYRRRRRRBBBBBBKKKKKK',
        'KKKKKKBBBBBBRRRRRRYYYYYYYYYYYYRRRRRRBBBBBBKKKKKK',
        'KKKKKKBBBBBBRRRRRRYYYYYYYYYYYYRRRRRRBBBBBBKKKKKK',
        'KKKKKKBBBBBBRRRRRRYYYYYYYYYYYYRRRRRRBBBBBBKKKKKK',
        'KKKKKKBBBBBBRRRRRRRYYYYYYYYYYRRRRRRRBBBBBBKKKKKK',
        'KKKKKKBBBBBBBRRRRRRYYYYYYYYYYRRRRRRBBBBBBBKKKKKK',
        'KKKKKKKBBBBBBRRRRRRRYYYYYYYYRRRRRRRBBBBBBKKKKKKK',
        ' KKKKKKBBBBBBRRRRRRRRRYYYYRRRRRRRRRBBBBBBKKKKKK ',
        ' KKKKKKBBBBBBBRRRRRRRRRRRRRRRRRRRRBBBBBBBKKKKKK ',
        ' KKKKKKKBBBBBBBRRRRRRRRRRRRRRRRRRBBBBBBBKKKKKKK ',
        '  KKKKKKBBBBBBBBRRRRRRRRRRRRRRRRBBBBBBBBKKKKKK  ',
        '  KKKKKKKBBBBBBBBRRRRRRRRRRRRRRBBBBBBBBKKKKKKK  ',
        '  KKKKKKKBBBBBBBBBRRRRRRRRRRRRBBBBBBBBBKKKKKKK  ',
        '   KKKKKKKBBBBBBBBBBBRRRRRRBBBBBBBBBBBKKKKKKK   ',
        '    KKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBBBKKKKKKK    ',
        '    KKKKKKKKBBBBBBBBBBBBBBBBBBBBBBBBKKKKKKKK    ',
        '     KKKKKKKKBBBBBBBBBBBBBBBBBBBBBBKKKKKKKK     ',
        '      KKKKKKKKKBBBBBBBBBBBBBBBBBBKKKKKKKKK      ',
        '       KKKKKKKKKKBBBBBBBBBBBBBBKKKKKKKKKK       ',
        '        KKKKKKKKKKKKBBBBBBBBKKKKKKKKKKKK        ',
        '         KKKKKKKKKKKKKKKKKKKKKKKKKKKKKK         ',
        '          KKKKKKKKKKKKKKKKKKKKKKKKKKKK          ',
        '            KKKKKKKKKKKKKKKKKKKKKKKK            ',
        '             KKKKKKKKKKKKKKKKKKKKKK             ',
        '                KKKKKKKKKKKKKKKK                ',
        '                   KKKKKKKKKK                   '
      ]
    }
  ]
};
