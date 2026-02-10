// ========================================
// グローバル設定
// ========================================
const GRID_WIDTH = 60;
const GRID_HEIGHT = 60;
const BASE_ATTACK = 250;     // 通常攻撃の基礎ダメージ
const BURST_DAMAGE = 1500;   // 使い切り攻撃のダメージ
// let usedTileTypes = new Set();  <-- これは削除
let tileUsageCounts = {}; // ★追加： { 1: 5, 2: 1 } のようにIDごとの使用回数を記録

// マスの種類定義
const TILE = {
  EMPTY: 0,
  ATTACK: 1, // 緑：通常攻撃
  SHIELD: 2, // 青：シールド（1回防御）
  BURST: 3,  // 赤：バースト（大ダメージ・使い切り）
  USED: 9,    // グレー：使用済み
  YELLOW: 10, // 4ダメージ
  RED: 11,    // 3ダメージ
  BLUE: 12,   // 2ダメージ
  BLACK: 13   // 1ダメージ
};

// ...（ダブルタップ関連はそのまま）...

// ========================================
// ゲーム状態
// ========================================

// プレイヤー状態
let playerLife = 10;      // ライフ10スタート
let playerShield = 0;     // 現在のシールド枚数（攻撃を何回防げるか）

// ダブルタップ検出用
let lastTapTime = 0;
const DOUBLE_TAP_DELAY = 300; // 300ms以内のタップをダブルタップと判定

// ========================================
// 敵データ
// ========================================

const ENEMIES = [
  // 1体目：プロト・ワン
  {
    name: 'プロト・ワン',
    hp: 10,
    patternX: 'sine', patternY: 'linear', coeffX: 1.0, coeffY: 0.1,
    
    // ★ここですべて管理します
    rules: {
      [TILE.ATTACK]: { limit: 99, damage: 1 },      // 緑：何回でも撃てる（制限99）、1ダメ
      [TILE.SHIELD]: { limit: 1, effect: 'shield' } // 青：ターン1回のみ、シールド効果
    },
    
    layouts: [
      { x: 0, y: 0, w: 20, h: 60, type: TILE.SHIELD },
      { x: 20, y: 0, w: 40, h: 60, type: TILE.ATTACK }
    ]
  },

  // 2体目：トライ・コア
  {
    name: 'トライ・コア',
    hp: 3,
    isRegen: true, // 全回復ギミック持ち
    patternX: 'cos', patternY: 'sine', coeffX: 1.5, coeffY: 1.5,

    // ★ここは全部「1回制限」にする
    rules: {
      [TILE.ATTACK]: { limit: 1, damage: 1 }, // 緑：1回だけ
      [TILE.SHIELD]: { limit: 1, damage: 1 }, // 青：1回だけ（この敵では攻撃扱い）
      [TILE.BURST]:  { limit: 1, damage: 1 }  // 赤：1回だけ
    },

    layouts: [
      { x: 25, y: 5, w: 10, h: 10, type: TILE.BURST },
      { x: 5, y: 40, w: 10, h: 10, type: TILE.SHIELD },
      { x: 45, y: 40, w: 10, h: 10, type: TILE.ATTACK }
    ]
  },
  // 3体目
  {
    name: 'ブルズ・アイ',
    hp: 10,
    patternX: 'zigzag',
    patternY: 'bounce',
    coeffX: 0.8,
    coeffY: 0.8,

    // ルール設定
    rules: {
      [TILE.YELLOW]: { limit: 99, damage: 4 }, // 中心（黄）：4ダメ
      [TILE.RED]:    { limit: 99, damage: 3 }, // 内側（赤）：3ダメ
      [TILE.BLUE]:   { limit: 99, damage: 2 }, // 中間（青）：2ダメ
      [TILE.BLACK]:  { limit: 99, damage: 1 }  // 外側（黒）：1ダメ
    },

    layouts: [
      {
        // 60x60グリッドの真ん中あたりに配置
        x: 20, 
        y: 20,
        
        // パレット定義（文字と色の対応）
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
  }
];
// ========================================
// ゲーム状態
// ========================================

let currentEnemy = null;
let currentEnemyHP = 0;
let tapCount = 0;
let cursorX = 0; // 0-1の値（滑らか）
let cursorY = 0; // 0-1の値（滑らか）
let animationTime = 0;
let animationFrameId = null;
let isAttacking = false;
let isEnemyTurn = false;

// キャンバス
let canvas = null;
let ctx = null;

// ピース配置（60x60の盤面、中央に緑のピース）
let board = [];

// ヒット痕
let hits = [];

// ========================================
// 初期化
// ========================================

function init() {
  canvas = document.getElementById('mainBoard');
  ctx = canvas.getContext('2d');
  
  // キャンバスサイズ設定（600x600ピクセル）
  canvas.width = 600;
  canvas.height = 600;
  
  // 盤面初期化
  //initBoard();
  
  // 敵を選択
  selectRandomEnemy();
  
  // タップイベント
  canvas.addEventListener('click', handleTap);
  canvas.addEventListener('touchstart', handleTap, { passive: false });
  
  // パターン変更イベント
  document.getElementById('pattern-x').addEventListener('change', updatePattern);
  document.getElementById('pattern-y').addEventListener('change', updatePattern);
  document.getElementById('coeff-x').addEventListener('input', updatePattern);
  document.getElementById('coeff-y').addEventListener('input', updatePattern);
  
  // グリッド以外の場所でダブルタップ全画面表示
  document.body.addEventListener('click', handleDoubleTapForFullscreen);
  document.body.addEventListener('touchstart', handleDoubleTapForFullscreen, { passive: false });
  
  // アニメーション開始
  animate();;
}

// 盤面初期化
function initBoard() {
  board = [];
  // 全体を空で初期化
  for (let y = 0; y < GRID_HEIGHT; y++) {
    board[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      board[y][x] = TILE.EMPTY;
    }
  }
  
  // 敵固有の配置を適用
  if (currentEnemy && currentEnemy.layouts) {
    currentEnemy.layouts.forEach(layout => {
      
      // ▼▼▼ 追加：ブループリント（文字列）方式 ▼▼▼
      if (layout.blueprint) {
        // パレット（文字とタイルの対応表）
        // layout.palette が定義されていれば使い、なければデフォルトを使う
        const palette = layout.palette || {
          '.': TILE.EMPTY,
          ' ': TILE.EMPTY,
          'x': TILE.ATTACK, // 緑
          '#': TILE.SHIELD, // 青
          '!': TILE.BURST,  // 赤
          // 的当て用の色
          'Y': TILE.YELLOW,
          'R': TILE.RED,
          'B': TILE.BLUE,
          'K': TILE.BLACK
        };

        // 文字列を解析して配置
        layout.blueprint.forEach((rowString, dy) => {
          for (let dx = 0; dx < rowString.length; dx++) {
            const char = rowString[dx];
            const tileType = palette[char];
            
            // 開始位置 (layout.x, layout.y) にズレを加算
            const targetX = layout.x + dx;
            const targetY = layout.y + dy;

            // 範囲内かつ、パレットに定義がある文字なら配置
            if (tileType !== undefined && 
                targetX >= 0 && targetX < GRID_WIDTH && 
                targetY >= 0 && targetY < GRID_HEIGHT) {
              board[targetY][targetX] = tileType;
            }
          }
        });
        return; // このlayout処理は完了
      }
      // ▲▲▲ 追加終わり ▲▲▲

      // --- 既存の円形配置 ---
      if (layout.shape === 'circle') {
        const cx = layout.x;
        const cy = layout.y;
        const r = layout.r;
        const r2 = r * r;
        const startY = Math.max(0, Math.floor(cy - r));
        const endY = Math.min(GRID_HEIGHT, Math.ceil(cy + r));
        const startX = Math.max(0, Math.floor(cx - r));
        const endX = Math.min(GRID_WIDTH, Math.ceil(cx + r));

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            if ((x - cx)**2 + (y - cy)**2 <= r2) {
              board[y][x] = layout.type;
            }
          }
        }
        return;
      }

      // --- 既存の矩形配置 ---
      for (let y = layout.y; y < layout.y + layout.h; y++) {
        for (let x = layout.x; x < layout.x + layout.w; x++) {
          if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
            board[y][x] = layout.type;
          }
        }
      }
    });
  }
}
// ランダムに敵を選択
function selectRandomEnemy() {
  // 敵を選ぶ（今回はプロト・ワン1体のみなので0番目）
  animationTime = 0;
  const enemyData = ENEMIES[2]; // テスト中は固定でもOK
  // 本番用: const enemyData = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

  currentEnemy = { ...enemyData };
  currentEnemyHP = currentEnemy.hp;
  
  // UI更新
  document.getElementById('enemy-name').textContent = currentEnemy.name;
  updateEnemyHP();
  
  // パターン選択UIへの反映など...（省略しても動きますが既存コードがあればそのままで）
  
  // ★ここに追加！敵が決まったので、そのレイアウトで盤面を作る
  initBoard();
}

// 敵HP更新
function updateEnemyHP() {
  const hpText = document.getElementById('enemy-hp-text');
  const hpFill = document.getElementById('enemy-hp-fill');
  
  hpText.textContent = `${Math.max(0, currentEnemyHP)}/${currentEnemy.hp}`;
  const hpPercent = (currentEnemyHP / currentEnemy.hp) * 100;
  hpFill.style.width = `${Math.max(0, hpPercent)}%`;
}

// パターン変更
function updatePattern() {
  currentEnemy.patternX = document.getElementById('pattern-x').value;
  currentEnemy.patternY = document.getElementById('pattern-y').value;
  currentEnemy.coeffX = parseFloat(document.getElementById('coeff-x').value) || 1.0;
  currentEnemy.coeffY = parseFloat(document.getElementById('coeff-y').value) || 1.3;
}

// ========================================
// タップ処理
// ========================================

function handleTap(e) {
  e.preventDefault();
  
  if (isAttacking || isEnemyTurn) return;
  
  tapCount++;
  document.getElementById('tap-num').textContent = tapCount;
  
  // 各タップごとに攻撃
  performAction();
  
  // 3回タップしたら敵のターン
  if (tapCount >= 3) {
    startEnemyTurn();
  }
}

// グリッド以外の場所でダブルタップ全画面表示
function handleDoubleTapForFullscreen(e) {
  // canvas内のタップは除外
  if (e.target === canvas || canvas.contains(e.target)) {
    return;
  }
  
  // select要素とinput要素のタップは除外（操作の邪魔にならないように）
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') {
    return;
  }
  
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTapTime;
  
  if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
    // ダブルタップ検出
    e.preventDefault();
    
    if (!document.fullscreenElement) {
      // 全画面表示
      document.documentElement.requestFullscreen().catch(err => {
        console.log('全画面表示エラー:', err);
      });
    }
  }
  
  lastTapTime = currentTime;
}

// アクション実行（攻撃・防御など）
function performAction() {
  isAttacking = true;
  
  // 座標計算
  const gridX = Math.floor(cursorX * GRID_WIDTH);
  const gridY = Math.floor(cursorY * GRID_HEIGHT);

  // 範囲外・空・使用済みチェック
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    showMessage('MISS'); isAttacking = false; return;
  }
  const tileType = board[gridY][gridX];
  if (tileType === TILE.EMPTY) {
    showMessage('MISS'); isAttacking = false; return;
  }

  // ★ルール取得（その敵の、その色の設定を見る）
  const rule = currentEnemy.rules[tileType];
  
  // ルール未定義ならバグなので弾く
  if (!rule) { isAttacking = false; return; }

  // ■ 回数制限チェック
  const currentCount = tileUsageCounts[tileType] || 0;
  if (currentCount >= rule.limit) {
    showMessage('ALREADY USED!');
    isAttacking = false;
    return;
  }

  // ■ 実行処理
  // カウントアップ
  tileUsageCounts[tileType] = currentCount + 1;
  hits.push({ gx: gridX, gy: gridY });

  // 効果発動
  if (currentEnemy.isRegen) {
    // トライ・コア用（全色1ダメ）
    currentEnemyHP -= 1;
    showMessage(`CORE BROKEN!`);
  } else {
    // 通常敵（ルール通りの効果）
    if (rule.damage) {
      currentEnemyHP -= rule.damage;
      showMessage(`HIT! -${rule.damage}`);
    }
    if (rule.effect === 'shield') {
      playerShield++;
      showMessage('SHIELD UP!');
    }
  }

  updateEnemyHP();

  // 勝利判定
  if (currentEnemyHP <= 0) {
    isEnemyTurn = true;
    setTimeout(showVictory, 500);
    return;
  }

  isAttacking = false;
}
// メッセージ表示
function showMessage(text, permanent = false) {
  const msgEl = document.getElementById('message');
  msgEl.textContent = text;
  
  if (!permanent) {
    setTimeout(() => {
      if (!isEnemyTurn) {
        msgEl.textContent = '画面をタップして攻撃';
      }
    }, 200);
  }
}

function startEnemyTurn() {
  isEnemyTurn = true;

  // アニメーション停止
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // ■ トライ・コア（再生持ち）の復活判定
  if (currentEnemy.isRegen && currentEnemyHP > 0) {
    showMessage('REGENERATING...', true);
    setTimeout(() => {
      // 全回復
      currentEnemyHP = currentEnemy.hp;
      updateEnemyHP();
      
      // 使用履歴リセット（これで盤面の色が戻る）
      tileUsageCounts = {};
      hits = [];
      
      showMessage('CORES RESTORED!', true);
      
      // ペナルティ攻撃
      setTimeout(() => {
        playerLife--;
        document.getElementById('player-life').textContent = playerLife;
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
        
        // プレイヤーターンへ戻る
        resetPlayerTurn();
      }, 1000);
    }, 500);
    return;
  }

  // ■ 通常の敵ターン処理
  showMessage('ENEMY ATTACK!', true);

  setTimeout(() => {
    // シールド判定
    if (playerShield > 0) {
      showMessage(`BLOCKED!`, true);
      playerShield = 0; // シールド使い切り
    } else {
      // ダメージ
      playerLife -= 1; // 固定1ダメージ
      document.getElementById('player-life').textContent = playerLife;
      document.body.classList.add('shake');
      setTimeout(() => document.body.classList.remove('shake'), 500);
      showMessage(`DAMAGE! Life: ${playerLife}`, true);
    }

    // ゲームオーバー判定
    if (playerLife <= 0) {
      setTimeout(() => {
        alert('GAME OVER');
        location.reload();
      }, 1000);
      return;
    }

    // プレイヤーターンへ戻る
    setTimeout(resetPlayerTurn, 1000);
  }, 700);
}

// （補助関数）プレイヤーターン再開処理を共通化
function resetPlayerTurn() {
  tapCount = 0;
  document.getElementById('tap-num').textContent = tapCount;
  
  // ★ここでリセットすることで、次のターンまた色が戻る
  hits = [];
  tileUsageCounts = {}; // ★リセット
  
  isEnemyTurn = false;
  showMessage('TAP TO ATTACK', true);
  animate();;
}

// 勝利表示
function showVictory() {
  const victoryEl = document.createElement('div');
  victoryEl.className = 'victory-message';
  victoryEl.textContent = '勝利！';
  document.body.appendChild(victoryEl);
  
  // アニメーションを一時停止
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  setTimeout(() => {
    victoryEl.remove();
    // 次の敵
    selectRandomEnemy();
    tapCount = 0;
    document.getElementById('tap-num').textContent = tapCount;
    // ヒット痕をクリア
    hits = [];
    tileUsageCounts = {};
    isEnemyTurn = false;
    isAttacking = false;
    showMessage('画面をタップして攻撃', true);
    // アニメーション再開
    animate();;
  }, 2000);
}

// ========================================
// アニメーション
// ========================================

function animate() {
  animationTime += 16; // 約16ms = 60fps
  
  // カーソル位置計算（0-1の値）
  const t = animationTime / 1000;
  cursorX = calculatePosition(currentEnemy.patternX, t, currentEnemy.coeffX, 1.0);
  cursorY = calculatePosition(currentEnemy.patternY, t, currentEnemy.coeffY, 1.0);
  
  // 描画
  draw();
  
  animationFrameId = requestAnimationFrame(animate);
}

// 位置計算（パターンに応じて）0-1の値を返す
function calculatePosition(pattern, t, coeff, max) {
  let value = 0;
  
  const tScaled = t * coeff;
  
  switch (pattern) {
    case 'sine':
      value = (Math.sin(tScaled) + 1) / 2;
      break;
    case 'cos':
      value = (Math.cos(tScaled) + 1) / 2;
      break;
    case 'linear':
      value = (tScaled * 0.5) % 1;
      break;
    case 'sawtooth':
      const phase = (tScaled * 0.8) % 2;
      value = phase > 1 ? 2 - phase : phase;
      break;
    case 'zigzag':
      value = Math.abs(Math.sin(tScaled * 2));
      break;
    case 'bounce':
      const bouncePhase = (tScaled * 0.8) % (2 * Math.PI);
      value = Math.abs(Math.sin(bouncePhase));
      break;
    default:
      value = 0.5;
  }
  
  return Math.max(0, Math.min(1, value));
}

// ========================================
// 描画
// ========================================

function draw() {
  // 背景クリア
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // グリッド描画
  drawGrid();
  
  // ピース描画
  drawPieces();
  
  // カーソル描画
  drawCursor();
}

// グリッド描画
function drawGrid() {
  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;
  
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  
  // 縦線
  for (let x = 0; x <= GRID_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellWidth, 0);
    ctx.lineTo(x * cellWidth, canvas.height);
    ctx.stroke();
  }
  
  // 横線
  for (let y = 0; y <= GRID_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellHeight);
    ctx.lineTo(canvas.width, y * cellHeight);
    ctx.stroke();
  }
}

function drawPieces() {
  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const type = board[y][x];
      if (type === TILE.EMPTY) continue;

      // ★ルール取得
      const rule = currentEnemy.rules[type];
      if (!rule) continue;

      const isHit = hits.some(h => h.gx === x && h.gy === y);
      const currentCount = tileUsageCounts[type] || 0;
      
      // ■ 色決定ロジック
      if (isHit) {
        // 直撃地点は常に白
        ctx.fillStyle = '#FFFFFF';
      } else if (currentCount >= rule.limit) {
        // 制限回数に達しているなら、残りは全部グレー
        ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
      } else {
        // まだ使えるなら通常色
        switch (type) {
          case TILE.ATTACK: ctx.fillStyle = 'rgba(0, 255, 136, 0.3)'; break;
          case TILE.SHIELD: ctx.fillStyle = 'rgba(0, 136, 255, 0.4)'; break;
          case TILE.BURST:  ctx.fillStyle = 'rgba(255, 50, 50, 0.5)'; break;
          
          // ★追加: 的の色
          case TILE.YELLOW: ctx.fillStyle = '#FFD700'; break; // 金色
          case TILE.RED:    ctx.fillStyle = '#DC143C'; break; // クリムゾン
          case TILE.BLUE:   ctx.fillStyle = '#1E90FF'; break; // ドジャーブルー
          case TILE.BLACK:  ctx.fillStyle = '#444444'; break; // 背景(#0a0a0a)より少し明るいグレー
          
          default: ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        }
      }
      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    }
  }
}

// カーソル描画
function drawCursor() {
  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;
  
  // カーソル位置（0-1）をピクセル座標に変換（滑らかに）
  const px = cursorX * canvas.width;
  const py = cursorY * canvas.height;
  
  // 赤い円でカーソル表示
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.arc(px, py, cellWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
  // 白い縁取り
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, cellWidth * 0.8, 0, Math.PI * 2);
  ctx.stroke();
}

// ========================================
// 起動
// ========================================

window.addEventListener('DOMContentLoaded', init);
