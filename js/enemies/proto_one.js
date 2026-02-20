// ========================================
// プロト・ワン（敵1）
// ========================================

import { TILE } from '../constants.js';

export const protoOne = {
  name: 'プロト・ワン',
  image: 'img/enemies/proto_one.png',
  hp: 10,
  patternX: 'sine',
  patternY: 'linear',
  coeffX: 1.0,
  coeffY: 0.1,
  
  // 色の説明
  colorLegend: [
    { color: 'RED', description: '1ダメージ' },
    { color: 'BLUE', description: '1ターンに1度のみ敵からの攻撃を無効化する。効果は重複しない。' }
  ],
  
  // この敵における各色の効果定義
  rules: {
    [TILE.RED]: {
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
  
  layouts: [
    {
      x: 6,
      y: 6,
      
      // パレット定義（文字と色IDのマッピング）
      palette: {
        '.': TILE.EMPTY,
        'B': TILE.BLUE,   // 青 (2ダメ)
        'R': TILE.RED,    // 赤 (3ダメ)
      },

      // 設計図（ドット絵で円を描く）
      blueprint: [

          '.......................................BBBBB......',
          '.....................................BBBBBBBBB....',
          '....................................BBBBBBBBBBB...',
          '...................................BBBBBBBBBBBBB..',
          '..................................BBBBBBBBBBBBBBB.',
          '..................................BBBBBBBBBBBBBBB.',
          '.................................BBBBBBBBBBBBBBBBB',
          '.................................BBBBBBBBBBBBBBBBB',
          '.................................BBBBBBBBBBBBBBBBB',
          '.................................BBBBBBBBBBBBBBBBB',
          '.....................RRRRRRRR....BBBBBBBBBBBBBBBBB',
          '..................RRRRRRRRRRRRRR..BBBBBBBBBBBBBBB.',
          '................RRRRRRRRRRRRRRRRRRBBBBBBBBBBBBBBB.',
          '...............RRRRRRRRRRRRRRRRRRRRBBBBBBBBBBBBB..',
          '..............RRRRRRRRRRRRRRRRRRRRRRBBBBBBBBBBB...',
          '.............RRRRRRRRRRRRRRRRRRRRRRRRBBBBBBBBB....',
          '............RRRRRRRRRRRRRRRRRRRRRRRRRR.BBBBB......',
          '............RRRRRRRRRRRRRRRRRRRRRRRRRR............',
          '...........RRRRRRRRRRRRRRRRRRRRRRRRRRRR...........',
          '...........RRRRRRRRRRRRRRRRRRRRRRRRRRRR...........',
          '...........RRRRRRRRRRRRRRRRRRRRRRRRRRRR...........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '..........RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR..........',
          '...........RRRRRRRRRRRRRRRRRRRRRRRRRRRR...........',
          '...........RRRRRRRRRRRRRRRRRRRRRRRRRRRR...........',
          '...........RRRRRRRRRRRRRRRRRRRRRRRRRRRR...........',
          '............RRRRRRRRRRRRRRRRRRRRRRRRRR............',
          '......BBBBB.RRRRRRRRRRRRRRRRRRRRRRRRRR............',
          '....BBBBBBBBBRRRRRRRRRRRRRRRRRRRRRRRR.............',
          '...BBBBBBBBBBBRRRRRRRRRRRRRRRRRRRRRR..............',
          '..BBBBBBBBBBBBBRRRRRRRRRRRRRRRRRRRR...............',
          '.BBBBBBBBBBBBBBBRRRRRRRRRRRRRRRRRR................',
          '.BBBBBBBBBBBBBBB..RRRRRRRRRRRRRR..................',
          'BBBBBBBBBBBBBBBBB....RRRRRRRR.....................',
          'BBBBBBBBBBBBBBBBB.................................',
          'BBBBBBBBBBBBBBBBB.................................',
          'BBBBBBBBBBBBBBBBB.................................',
          'BBBBBBBBBBBBBBBBB.................................',
          '.BBBBBBBBBBBBBBB..................................',
          '.BBBBBBBBBBBBBBB..................................',
          '..BBBBBBBBBBBBB...................................',
          '...BBBBBBBBBBB....................................',
          '....BBBBBBBBB.....................................',
          '......BBBBBB......................................'
      ]
    }
  ]
};
