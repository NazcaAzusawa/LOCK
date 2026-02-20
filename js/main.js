// ========================================
// メインロジック（ES Modules版）
// ========================================

import { TILE, GRID_WIDTH, GRID_HEIGHT } from "./constants.js";
import { protoOne } from "./enemies/proto_one.js";
import { triCore } from "./enemies/tri_core.js";
import { bullseye } from "./enemies/bullseye.js";
import { frostEye } from "./enemies/frost_eye.js";
import { phaseGhost } from "./enemies/phase_ghost.js";
import { ampCore } from "./enemies/amp_core.js";
import { diceCore } from "./enemies/dice_core.js";
import { mirrorCore } from "./enemies/mirror_core.js";
import { zoneSplitter } from "./enemies/zone_splitter.js";
import { blindGhost } from "./enemies/blind_ghost.js";

// ========================================
// 敵データリスト
// ========================================

const ENEMIES = [protoOne, triCore, bullseye, frostEye, phaseGhost, ampCore, diceCore, mirrorCore, zoneSplitter, blindGhost];

// ========================================
// ゲーム状態
// ========================================

// プレイヤー状態
let playerLife = 5;
let playerShield = 0;

// タイル使用回数管理
let tileUsageCounts = {};

// カーソル速度倍率（ターン終了時にリセット）
let turnSpeedMultiplier = 1.0;

// 敵の次の攻撃ダメージ（黄色タイルで倍増、ターン終了時にリセット）
let pendingEnemyAttack = 1;

// 赤タイルのヒット確率ボーナス（青タイルで加算、ターン終了時にリセット）
let hitChanceBonus = 0;

// 敵攻撃への対抗措置（ターン終了時にリセット）
let enemyAttackReduction = 0; // 緑：攻撃ダメージを減算
let shieldThreshold = 0;      // 青：N以下のダメージを無効化
let reflectFlag = false;       // 水色：ダメージを敵に反射

// カーソルX軸ゾーン制限（敵選択時にリセット、ターン跨ぎで維持）
let cursorZone = null; // null=制限なし, 'left'=左半分, 'right'=右半分

// ターン内ヒット色セット（赤青コンボ判定用、ターン終了時にリセット）
let hitColorsThisTurn = new Set();

// 多段盤面：現在のフェーズ番号（ダメージを受けるたびに進む）
let currentPhase = 0;

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
let cursorHidden = false; // 3タップ後〜次ターン開始まで非表示

// キャンバス
let canvas = null;
let ctx = null;

// ピース配置
let board = [];

// ヒット痕
let hits = [];

// ミス痕（空マスタップ時のピクセル座標）
let missMarks = [];

// ========================================
// 初期化
// ========================================

function init() {
  canvas = document.getElementById("mainBoard");
  ctx = canvas.getContext("2d");

  canvas.width = 600;
  canvas.height = 600;

  selectRandomEnemy();

  canvas.addEventListener("click", handleTap);
  canvas.addEventListener("touchstart", handleTap, { passive: false });

  animate();

  // DOMContentLoaded 時点ではフレックスレイアウトが未確定のため
  // 最初のフレーム後に HP バーを再描画して確実に表示する
  requestAnimationFrame(updateEnemyHP);
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

  // phaseLayouts があれば現在フェーズの配列を、なければ通常の layouts を使用
  const activeLayouts = currentEnemy?.phaseLayouts
    ? (currentEnemy.phaseLayouts[currentPhase] || [])
    : (currentEnemy?.layouts || []);

  if (activeLayouts.length > 0) {
    activeLayouts.forEach((layout) => {
      // ブループリント（文字列）方式
      if (layout.blueprint) {
        const palette = layout.palette || {
          ".": TILE.EMPTY,
          " ": TILE.EMPTY,
          x: TILE.GREEN,
          "#": TILE.BLUE,
          "!": TILE.RED,
          Y: TILE.YELLOW,
          R: TILE.RED,
          B: TILE.BLUE,
          K: TILE.BLACK,
        };

        layout.blueprint.forEach((rowString, dy) => {
          for (let dx = 0; dx < rowString.length; dx++) {
            const char = rowString[dx];
            const tileType = palette[char];

            const targetX = layout.x + dx;
            const targetY = layout.y + dy;

            if (
              tileType !== undefined &&
              targetX >= 0 &&
              targetX < GRID_WIDTH &&
              targetY >= 0 &&
              targetY < GRID_HEIGHT
            ) {
              board[targetY][targetX] = tileType;
            }
          }
        });
        return;
      }

      // 円形配置
      if (layout.shape === "circle") {
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
            if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) {
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
  currentPhase = 0;
  const enemyData = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];

  currentEnemy = { ...enemyData };
  currentEnemyHP = currentEnemy.hp;
  pendingEnemyAttack = currentEnemy.attackDamage || 1;
  cursorZone = currentEnemy.initialZone || null;

  document.getElementById("enemy-name").textContent = currentEnemy.name;

  const enemyImg = document.getElementById("enemy-img");
  if (enemyImg) enemyImg.src = currentEnemy.image || "";

  updateEnemyHP();
  updateColorLegend();
  updateSpecialAbilities();

  initBoard();
}

// ========================================
// UI更新
// ========================================

function updatePlayerHearts() {
  const hearts = document.querySelectorAll(".heart");
  hearts.forEach((heart, i) => {
    heart.src = i < playerLife ? "img/fill.png" : "img/empty.png";
  });
}

function updateEnemyHP() {
  const bar = document.getElementById("enemy-hp-bar");
  bar.innerHTML = "";

  for (let i = 0; i < currentEnemy.hp; i++) {
    const seg = document.createElement("div");
    seg.className = "hp-segment " + (i < currentEnemyHP ? "hp-filled" : "hp-empty");
    bar.appendChild(seg);
  }
}

function updateColorLegend() {
  const legendEl = document.getElementById("color-legend");
  legendEl.innerHTML = "";

  if (!currentEnemy.colorLegend) return;

  const label = document.createElement("div");
  label.id = "color-legend-label";
  label.textContent = "◆ 色の効果";
  legendEl.appendChild(label);

  currentEnemy.colorLegend.forEach((item) => {
    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";

    const colorBox = document.createElement("div");
    colorBox.className = "legend-color";

    // 色を設定
    switch (item.color) {
      case "RED":
        colorBox.style.backgroundColor = "rgba(255, 50, 50, 0.8)";
        break;
      case "BLUE":
        colorBox.style.backgroundColor = "rgba(0, 136, 255, 0.8)";
        break;
      case "GREEN":
        colorBox.style.backgroundColor = "rgba(0, 255, 136, 0.8)";
        break;
      case "YELLOW":
        colorBox.style.backgroundColor = "#FFD700";
        break;
      case "BLACK":
        colorBox.style.backgroundColor = "#444444";
        break;
      case "WHITE":
        colorBox.style.backgroundColor = "#FFFFFF";
        break;
      case "CYAN":
        colorBox.style.backgroundColor = "rgba(0, 220, 255, 0.8)";
        break;
      case "GRAY":
        colorBox.style.backgroundColor = "rgba(160, 160, 160, 0.9)";
        break;
    }

    const description = document.createElement("span");
    description.textContent = item.description;

    legendItem.appendChild(colorBox);
    legendItem.appendChild(description);
    legendEl.appendChild(legendItem);
  });
}

function updateSpecialAbilities() {
  const el = document.getElementById("special-abilities");
  el.innerHTML = "";

  const abilities = currentEnemy.specialAbilities;
  if (!abilities || abilities.length === 0) {
    el.classList.remove("visible");
    return;
  }

  el.classList.add("visible");

  const label = document.createElement("div");
  label.id = "special-abilities-label";
  label.textContent = "◆ 特殊効果";
  el.appendChild(label);

  abilities.forEach((text) => {
    const item = document.createElement("div");
    item.className = "special-item";
    item.textContent = "▸ " + text;
    el.appendChild(item);
  });
}

// ========================================
// タップ処理
// ========================================

function handleTap(e) {
  e.preventDefault();

  if (isAttacking || isEnemyTurn) return;

  tapCount++;

  performAction();

  if (tapCount >= 3) {
    startEnemyTurn();
  }
}

// ========================================
// アクション実行（汎用化）
// ========================================

function performAction() {
  isAttacking = true;

  const gridX = Math.floor(cursorX * GRID_WIDTH);
  const gridY = Math.floor(cursorY * GRID_HEIGHT);

  // 範囲外チェックはスキップ（グリッド外ではミス痕なし）
  if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
    isAttacking = false;
    return;
  }

  const tileType = board[gridY][gridX];

  // 空マスチェック：グリッド座標で記録
  if (tileType === TILE.EMPTY) {
    missMarks.push({ gx: gridX, gy: gridY });
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
    showMessage("ALREADY USED!");
    isAttacking = false;
    return;
  }

  // カウントアップ
  tileUsageCounts[tileType] = currentCount + 1;
  hits.push({ gx: gridX, gy: gridY });
  hitColorsThisTurn.add(tileType);

  // ★汎用化：onHit実行
  const prevHP = currentEnemyHP;
  const context = {
    enemyHP: currentEnemyHP,
    playerShield: playerShield,
    showMessage: showMessage,
    setSpeedMultiplier: (v) => { turnSpeedMultiplier = v; },
    setTapCount: (v) => {
      tapCount = v;
    },
    setEnemyAttack: (v) => { pendingEnemyAttack = v; },
    getEnemyAttack: () => pendingEnemyAttack,
    addHitChanceBonus: (v) => { hitChanceBonus += v; },
    getHitChanceBonus: () => hitChanceBonus,
    addAttackReduction: (v) => { enemyAttackReduction += v; },
    setShieldThreshold: (v) => { if (v > shieldThreshold) shieldThreshold = v; },
    setReflect: () => { reflectFlag = true; },
    getHitColors: () => hitColorsThisTurn,
    toggleZone: () => {
      if (cursorZone === 'left') cursorZone = 'right';
      else if (cursorZone === 'right') cursorZone = 'left';
    },
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

  // フェーズシフト：ダメージを受けた && phaseLayouts あり && 次のフェーズが存在する
  if (context.enemyHP < prevHP && currentEnemy.phaseLayouts) {
    const nextPhase = Math.min(currentPhase + 1, currentEnemy.phaseLayouts.length - 1);
    if (nextPhase !== currentPhase) {
      currentPhase = nextPhase;
      initBoard();
      showMessage("PHASE SHIFT!", true);
      setTimeout(() => { if (!isEnemyTurn) showMessage("TAP TO ATTACK", true); }, 800);
    }
  }

  isAttacking = false;
}

// ========================================
// メッセージ表示
// ========================================

function showMessage(text, permanent = false) {
  // #message 要素は削除済みのため何もしない
}

// ========================================
// 敵ターン処理
// ========================================

function startEnemyTurn() {
  isEnemyTurn = true;
  cursorHidden = true;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // カーソルを消した状態でキャンバスを再描画
  draw();

  // トライ・コア（再生持ち）の復活判定
  if (currentEnemy.isRegen && currentEnemyHP > 0) {
    showMessage("REGENERATING...", true);
    setTimeout(() => {
      currentEnemyHP = currentEnemy.hp;
      updateEnemyHP();

      tileUsageCounts = {};
      hits = [];

      showMessage("CORES RESTORED!", true);

      setTimeout(() => {
        playerLife--;
        updatePlayerHearts();
        document.body.classList.add("shake");
        setTimeout(() => document.body.classList.remove("shake"), 500);

        resetPlayerTurn();
      }, 1000);
    }, 500);
    return;
  }

  // 通常の敵ターン処理
  showMessage("ENEMY ATTACK!", true);

  setTimeout(() => {
    // 緑による軽減後のダメージ
    const reducedDamage = Math.max(0, pendingEnemyAttack - enemyAttackReduction);

    // 水色リフレクト：無効化前のダメージを敵に反射
    if (reflectFlag && reducedDamage > 0) {
      currentEnemyHP -= reducedDamage;
      updateEnemyHP();
      if (currentEnemyHP <= 0) {
        showMessage("REFLECTED! Enemy defeated!", true);
        setTimeout(showVictory, 500);
        return;
      }
    }

    // 無効化判定（既存シールド or 青の閾値）
    const isBlocked =
      playerShield > 0 ||
      (shieldThreshold > 0 && reducedDamage <= shieldThreshold);

    if (isBlocked) {
      showMessage(reflectFlag ? "REFLECT & BLOCK!" : "BLOCKED!", true);
      if (playerShield > 0) playerShield = 0;
    } else if (reducedDamage === 0) {
      showMessage(reflectFlag ? "REFLECT! No damage." : "REDUCED to 0!", true);
    } else {
      playerLife -= reducedDamage;
      updatePlayerHearts();
      document.body.classList.add("shake");
      setTimeout(() => document.body.classList.remove("shake"), 500);
      showMessage(`DAMAGE! -${reducedDamage}  Life: ${playerLife}`, true);
    }

    // ゲームオーバー判定
    if (playerLife <= 0) {
      setTimeout(() => {
        alert("GAME OVER");
        location.reload();
      }, 1000);
      return;
    }

    setTimeout(resetPlayerTurn, 1000);
  }, 700);
}

function resetPlayerTurn() {
  tapCount = 0;

  hits = [];
  missMarks = [];
  tileUsageCounts = {};
  turnSpeedMultiplier = 1.0;
  pendingEnemyAttack = currentEnemy?.attackDamage || 1;
  hitChanceBonus = 0;
  enemyAttackReduction = 0;
  shieldThreshold = 0;
  reflectFlag = false;
  hitColorsThisTurn = new Set();

  isEnemyTurn = false;
  cursorHidden = false;
  showMessage("TAP TO ATTACK", true);
  animate();
}

// ========================================
// 勝利表示
// ========================================

function showVictory() {
  const victoryEl = document.createElement("div");
  victoryEl.className = "victory-message";
  victoryEl.textContent = "勝利！";
  document.body.appendChild(victoryEl);

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  setTimeout(() => {
    victoryEl.remove();
    selectRandomEnemy();
    tapCount = 0;
    hits = [];
    tileUsageCounts = {};
    turnSpeedMultiplier = 1.0;
    pendingEnemyAttack = 1;
    hitChanceBonus = 0;
    enemyAttackReduction = 0;
    shieldThreshold = 0;
    reflectFlag = false;
    hitColorsThisTurn = new Set();
    missMarks = [];
    isEnemyTurn = false;
    cursorHidden = false;
    isAttacking = false;
    animate();
  }, 2000);
}

// ========================================
// アニメーション
// ========================================

function animate() {
  animationTime += 16 * turnSpeedMultiplier;

  const t = animationTime / 1000;
  const rawX = calculatePosition(
    currentEnemy.patternX,
    t,
    currentEnemy.coeffX,
    1.0,
  );
  cursorY = calculatePosition(
    currentEnemy.patternY,
    t,
    currentEnemy.coeffY,
    1.0,
  );

  // ゾーン制限：左半分 or 右半分にXをリマップ
  if (cursorZone === 'left') {
    cursorX = rawX * 0.5;
  } else if (cursorZone === 'right') {
    cursorX = 0.5 + rawX * 0.5;
  } else {
    cursorX = rawX;
  }

  draw();

  animationFrameId = requestAnimationFrame(animate);
}

function calculatePosition(pattern, t, coeff, max) {
  let value = 0;

  const tScaled = t * coeff;
  const T = tScaled;
  const PI = Math.PI;

  switch (pattern) {
    case "sine":
      value = (Math.sin(tScaled) + 1) / 2;
      break;
    case "cos":
      value = (Math.cos(tScaled) + 1) / 2;
      break;
    case "linear":
      value = (tScaled * 0.5) % 1;
      break;
    case "sawtooth":
      const phase = (tScaled * 0.8) % 2;
      value = phase > 1 ? 2 - phase : phase;
      break;
    case "zigzag":
      value = Math.abs(Math.sin(tScaled * 2));
      break;
    case "bounce":
      const bouncePhase = (tScaled * 0.8) % (2 * Math.PI);
      value = Math.abs(Math.sin(bouncePhase));
      break;
    case "center":
      const s = Math.sin(T);
      const stick = 2; // 大きいほど中央に長くいる
      value = 0.5 + 0.5 * Math.sign(s) * Math.pow(Math.abs(s), stick);
      break;
    case "spike":
      const phase1 = (T * 0.6) % 1;
      value =
        phase1 < 0.1 ? phase1 * 10 : Math.max(0, 1 - (phase1 - 0.1) * 1.2);
      break;
    case "breath":
      const slow = Math.sin(T * 0.4);
      const fast = Math.sin(T * 1.3);
      value = (slow * 0.6 + fast * 0.4 + 1) / 2;
      break;
    case "chaos":
      const n =
        Math.sin(T) + 0.6 * Math.sin(T * 1.618) + 0.3 * Math.sin(T * 2.718);
      value = (n + 1.9) / 3.8;
      break;
    case "pendulum":
      const s1 = Math.sin(T);
      value = (Math.sign(s1) * Math.pow(Math.abs(s1), 0.6) + 1) / 2;
      break;
    case "doubleSine":
      const a = Math.sin(T);
      const b = 0.4 * Math.sin(T * 2.73);
      value = (a + b + 1.4) / 2.8;
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
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawPieces();
  drawMissMarks();

  if (currentEnemy?.hideCursorUpperHalf) {
    drawUpperHalfFog();
  }

  drawCursor();
}

function drawMissMarks() {
  const cellWidth  = canvas.width  / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;
  ctx.fillStyle = "#FFFFFF";
  for (const mark of missMarks) {
    ctx.fillRect(mark.gx * cellWidth, mark.gy * cellHeight, cellWidth, cellHeight);
  }
}

// 上半分フォグ：タイルは見えるがカーソルが消える霧エフェクト
function drawUpperHalfFog() {
  const halfH = canvas.height / 2;

  // ベースの霞オーバーレイ
  ctx.fillStyle = "rgba(100, 140, 200, 0.12)";
  ctx.fillRect(0, 0, canvas.width, halfH);

  // 走査線ノイズでブラー感を演出
  ctx.strokeStyle = "rgba(180, 210, 255, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y < halfH; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // 下端グラデーション（境界をなじませる）
  const grad = ctx.createLinearGradient(0, halfH - 30, 0, halfH);
  grad.addColorStop(0, "rgba(100, 140, 200, 0.12)");
  grad.addColorStop(1, "rgba(100, 140, 200, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, halfH - 30, canvas.width, 30);
}

function drawGrid() {
  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;

  ctx.strokeStyle = "#1a1a1a";
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

      const isHit = hits.some((h) => h.gx === x && h.gy === y);
      const currentCount = tileUsageCounts[type] || 0;

      // 色決定ロジック（機能による分岐を排除）
      if (isHit) {
        // 直撃地点は常に白
        ctx.fillStyle = "#FFFFFF";
      } else if (currentCount >= rule.limit) {
        // 制限回数に達した色はグレー
        ctx.fillStyle = "rgba(80, 80, 80, 0.5)";
      } else {
        // 通常の色表示（色IDのみで判定）
        switch (type) {
          case TILE.GREEN:
            ctx.fillStyle = "rgba(0, 255, 136, 0.3)";
            break;
          case TILE.BLUE:
            ctx.fillStyle = "rgba(0, 136, 255, 0.4)";
            break;
          case TILE.RED:
            ctx.fillStyle = "rgba(255, 50, 50, 0.5)";
            break;
          case TILE.YELLOW:
            ctx.fillStyle = "#FFD700";
            break;
          case TILE.BLACK:
            ctx.fillStyle = "#444444";
            break;
          case TILE.WHITE:
            ctx.fillStyle = "#FFFFFF";
            break;
          case TILE.CYAN:
            ctx.fillStyle = "rgba(0, 220, 255, 0.4)";
            break;
          case TILE.GRAY:
            ctx.fillStyle = "rgba(160, 160, 160, 0.45)";
            break;
          default:
            ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        }
      }

      ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    }
  }
}

function drawCursor() {
  // 3タップ後〜次ターン開始まで非表示
  if (cursorHidden) return;

  // 上半分不可視の敵：カーソルが上半分にいるとき描画しない
  if (currentEnemy?.hideCursorUpperHalf && cursorY < 0.5) return;

  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;

  const px = cursorX * canvas.width;
  const py = cursorY * canvas.height;

  ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
  ctx.beginPath();
  ctx.arc(px, py, cellWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, cellWidth * 0.8, 0, Math.PI * 2);
  ctx.stroke();
}

// ========================================
// 起動
// ========================================

window.addEventListener("DOMContentLoaded", init);
