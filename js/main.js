// ========================================
// メインロジック（ES Modules版）
// ========================================

import { TILE, GRID_WIDTH, GRID_HEIGHT } from './constants.js';
import { protoOne } from './enemies/proto_one.js';
import { triCore } from './enemies/tri_core.js';
import { bullseye } from './enemies/bullseye.js';

// ========================================
// 敵データリスト
// ========================================

const ENEMIES = [protoOne, triCore, bullseye];

// ========================================
// ゲーム状態
// ========================================

// プレイヤー状態
let playerLife = 10;
let playerShield = 0;

// タイル使用回数管理
let tileUsageCounts = {};

// ダブルタップ検出用
let lastTapTime = 0;
const DOUBLE_TAP_DELAY = 300;

// 敵状態
let currentEnemy = null;
let currentEnemyHP = 0;
let tapCount = 0;
let cursorX = 0;
let cursorY = 0;
let animationTime = 0;
let animationFrameId = null;
let isAttacking = false;
let isEnemyTurn = false;

// キャンバス
let canvas = null;
let ctx = null;

// ピース配置
let board = [];

// ヒット痕
let hits = [];

// ========================================
// 初期化
// ========================================

function init() {
  canvas = document.getElementById('mainBoard');
  ctx = canvas.getContext('2d');
  
  canvas.width = 600;
  canvas.height = 600;
  
  selectRandomEnemy();
  
  canvas.addEventListener('click', handleTap);
  canvas.addEventListener('touchstart', handleTap, { passive: false });
  
  document.getElementById('pattern-x').addEventListener('change', updatePattern);
  document.getElementById('pattern-y').addEventListener('change', updatePattern);
  document.getElementById('coeff-x').addEventListener('input', updatePattern);
  document.getElementById('coeff-y').addEventListener('input', updatePattern);
  
  document.body.addEventListener('click', handleDoubleTapForFullscreen);
  document.body.addEventListener('touchstart', handleDoubleTapForFullscreen, { passive: false });
  
  animate();
}

// ========================================
// 盤面初期化
// ========================================

function initBoard() {
  board = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    board[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
      board[y][x] = TILE.EMPTY;
    }
  }
  
  if (currentEnemy && currentEnemy.layouts) {
    currentEnemy.layouts.forEach(layout => {
      
      // ブループリント（文字列）方式
      if (layout.blueprint) {
        const palette = layout.palette || {
          '.': TILE.EMPTY,
          ' ': TILE.EMPTY,
          'x': TILE.GREEN,
          '#': TILE.BLUE,
          '!': TILE.RED,
          'Y': TILE.YELLOW,
          'R': TILE.RED,
          'B': TILE.BLUE,
          'K': TILE.BLACK
        };

        layout.blueprint.forEach((rowString, dy) => {
          for (let dx = 0; dx < rowString.length; dx++) {
            const char = rowString[dx];
            const tileType = palette[char];
            
            const targetX = layout.x + dx;
            const targetY = layout.y + dy;

            if (tileType !== undefined && 
                targetX >= 0 && targetX < GRID_WIDTH && 
                targetY >= 0 && targetY < GRID_HEIGHT) {
              board[targetY][targetX] = tileType;
            }
          }
        });
        return;
      }

      // 円形配置
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

      // 矩形配置
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

// ========================================
// 敵選択
// ========================================

function selectRandomEnemy() {
  animationTime = 0;
const enemyData = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

  currentEnemy = { ...enemyData };
  currentEnemyHP = currentEnemy.hp;
  
  document.getElementById('enemy-name').textContent = currentEnemy.name;
  updateEnemyHP();
  
  initBoard();
}

// ========================================
// UI更新
// ========================================

function updateEnemyHP() {
  const hpText = document.getElementById('enemy-hp-text');
  const hpFill = document.getElementById('enemy-hp-fill');
  
  hpText.textContent = `${Math.max(0, currentEnemyHP)}/${currentEnemy.hp}`;
  const hpPercent = (currentEnemyHP / currentEnemy.hp) * 100;
  hpFill.style.width = `${Math.max(0, hpPercent)}%`;
}

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
  
  performAction();
  
  if (tapCount >= 3) {
    startEnemyTurn();
  }
}

function handleDoubleTapForFullscreen(e) {
  if (e.target === canvas || canvas.contains(e.target)) {
    return;
  }
  
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') {
    return;
  }
  
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTapTime;
  
  if (tapLength < DOUBLE_TAP_DELAY && tapLength > 0) {
    e.preventDefault();
    
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('全画面表示エラー:', err);
      });
    }
  }
  
  lastTapTime = currentTime;
}

// ========================================
// アクション実行（汎用化）
// ========================================

function performAction() {
  isAttacking = true;
  
  const gridX = Math.floor(cursorX * GRID_WIDTH);
  const gridY = Math.floor(cursorY * GRID_HEIGHT);

  // 範囲外チェック
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    showMessage('MISS');
    isAttacking = false;
    return;
  }
  
  const tileType = board[gridY][gridX];
  
  // 空マスチェック
  if (tileType === TILE.EMPTY) {
    showMessage('MISS');
    isAttacking = false;
    return;
  }

  // ★汎用化：ルール取得
  const rule = currentEnemy.rules[tileType];
  
  if (!rule) {
    isAttacking = false;
    return;
  }

  // 回数制限チェック
  const currentCount = tileUsageCounts[tileType] || 0;
  if (currentCount >= rule.limit) {
    showMessage('ALREADY USED!');
    isAttacking = false;
    return;
  }

  // カウントアップ
  tileUsageCounts[tileType] = currentCount + 1;
  hits.push({ gx: gridX, gy: gridY });

  // ★汎用化：onHit実行
  const context = {
    enemyHP: currentEnemyHP,
    playerShield: playerShield,
    showMessage: showMessage
  };
  
  rule.onHit(context);
  
  // コンテキストから状態を反映
  currentEnemyHP = context.enemyHP;
  playerShield = context.playerShield;

  updateEnemyHP();

  // 勝利判定
  if (currentEnemyHP <= 0) {
    isEnemyTurn = true;
    setTimeout(showVictory, 500);
    return;
  }

  isAttacking = false;
}

// ========================================
// メッセージ表示
// ========================================

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

// ========================================
// 敵ターン処理
// ========================================

function startEnemyTurn() {
  isEnemyTurn = true;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // トライ・コア（再生持ち）の復活判定
  if (currentEnemy.isRegen && currentEnemyHP > 0) {
    showMessage('REGENERATING...', true);
    setTimeout(() => {
      currentEnemyHP = currentEnemy.hp;
      updateEnemyHP();
      
      tileUsageCounts = {};
      hits = [];
      
      showMessage('CORES RESTORED!', true);
      
      setTimeout(() => {
        playerLife--;
        document.getElementById('player-life').textContent = playerLife;
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 500);
        
        resetPlayerTurn();
      }, 1000);
    }, 500);
    return;
  }

  // 通常の敵ターン処理
  showMessage('ENEMY ATTACK!', true);

  setTimeout(() => {
    if (playerShield > 0) {
      showMessage('BLOCKED!', true);
      playerShield = 0;
    } else {
      playerLife -= 1;
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

    setTimeout(resetPlayerTurn, 1000);
  }, 700);
}

function resetPlayerTurn() {
  tapCount = 0;
  document.getElementById('tap-num').textContent = tapCount;
  
  hits = [];
  tileUsageCounts = {};
  
  isEnemyTurn = false;
  showMessage('TAP TO ATTACK', true);
  animate();
}

// ========================================
// 勝利表示
// ========================================

function showVictory() {
  const victoryEl = document.createElement('div');
  victoryEl.className = 'victory-message';
  victoryEl.textContent = '勝利！';
  document.body.appendChild(victoryEl);
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  setTimeout(() => {
    victoryEl.remove();
    selectRandomEnemy();
    tapCount = 0;
    document.getElementById('tap-num').textContent = tapCount;
    hits = [];
    tileUsageCounts = {};
    isEnemyTurn = false;
    isAttacking = false;
    showMessage('画面をタップして攻撃', true);
    animate();
  }, 2000);
}

// ========================================
// アニメーション
// ========================================

function animate() {
  animationTime += 16;
  
  const t = animationTime / 1000;
  cursorX = calculatePosition(currentEnemy.patternX, t, currentEnemy.coeffX, 1.0);
  cursorY = calculatePosition(currentEnemy.patternY, t, currentEnemy.coeffY, 1.0);
  
  draw();
  
  animationFrameId = requestAnimationFrame(animate);
}

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
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  drawGrid();
  drawPieces();
  drawCursor();
}

function drawGrid() {
  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;
  
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;
  
  for (let x = 0; x <= GRID_WIDTH; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cellWidth, 0);
    ctx.lineTo(x * cellWidth, canvas.height);
    ctx.stroke();
  }
  
  for (let y = 0; y <= GRID_HEIGHT; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cellHeight);
    ctx.lineTo(canvas.width, y * cellHeight);
    ctx.stroke();
  }
}

// ★汎用化：色IDのみで判定
function drawPieces() {
  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;

  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      const type = board[y][x];
      if (type === TILE.EMPTY) continue;

      const rule = currentEnemy.rules[type];
      if (!rule) continue;

      const isHit = hits.some(h => h.gx === x && h.gy === y);
      const currentCount = tileUsageCounts[type] || 0;
      
      // 色決定ロジック（機能による分岐を排除）
      if (isHit) {
        // 直撃地点は常に白
        ctx.fillStyle = '#FFFFFF';
      } else if (currentCount >= rule.limit) {
        // 制限回数に達した色はグレー
        ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
      } else {
        // 通常の色表示（色IDのみで判定）
        switch (type) {
          case TILE.GREEN:
            ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            break;
          case TILE.BLUE:
            ctx.fillStyle = 'rgba(0, 136, 255, 0.4)';
            break;
          case TILE.RED:
            ctx.fillStyle = 'rgba(255, 50, 50, 0.5)';
            break;
          case TILE.YELLOW:
            ctx.fillStyle = '#FFD700';
            break;
          case TILE.BLACK:
            ctx.fillStyle = '#444444';
            break;
          case TILE.WHITE:
            ctx.fillStyle = '#FFFFFF';
            break;
          default:
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        }
      }
      
      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    }
  }
}

function drawCursor() {
  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;
  
  const px = cursorX * canvas.width;
  const py = cursorY * canvas.height;
  
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.arc(px, py, cellWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();
  
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
