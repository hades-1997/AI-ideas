/**
 * ============================================
 * CỜ CARO - Game Logic (Client-side)
 * Gomoku / Five-in-a-Row
 * ============================================
 */

const BOARD_SIZE = 20;
const WIN_LENGTH = 5;

class CaroGame {
  constructor() {
    this.board = [];
    this.currentPlayer = 'X'; // Player is X, AI is O
    this.gameOver = false;
    this.moveHistory = [];
    this.winningCells = [];
    this.lastMove = null;
    this.scores = { x: 0, o: 0, draw: 0 };
    this.difficulty = 'medium'; // easy, medium, hard
    this.aiThinking = false;

    this.loadScores();
    this.init();
  }

  init() {
    this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(''));
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.moveHistory = [];
    this.winningCells = [];
    this.lastMove = null;
    this.aiThinking = false;

    this.renderBoard();
    this.updateStatus();
    this.updateMoveHistory();
    this.bindEvents();
  }

  // === RENDERING ===

  renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.id = `cell-${r}-${c}`;
        boardEl.appendChild(cell);
      }
    }
  }

  updateCell(row, col, animate = true) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    if (!cell) return;

    const val = this.board[row][col];

    // Clear old classes
    cell.classList.remove('cell-x', 'cell-o', 'cell-last', 'cell-win', 'cell-animate', 'cell-disabled');

    if (val === 'X') {
      cell.classList.add('cell-x');
      cell.textContent = 'X';
      if (animate) cell.classList.add('cell-animate');
    } else if (val === 'O') {
      cell.classList.add('cell-o');
      cell.textContent = 'O';
      if (animate) cell.classList.add('cell-animate');
    } else {
      cell.textContent = '';
    }

    // Last move highlight
    if (this.lastMove && this.lastMove[0] === row && this.lastMove[1] === col) {
      cell.classList.add('cell-last');
    }

    if (this.gameOver) {
      cell.classList.add('cell-disabled');
    }
  }

  highlightWin() {
    this.winningCells.forEach(([r, c]) => {
      const cell = document.getElementById(`cell-${r}-${c}`);
      if (cell) cell.classList.add('cell-win');
    });
  }

  clearLastMoveHighlight() {
    document.querySelectorAll('.cell-last').forEach(el => el.classList.remove('cell-last'));
  }

  updateStatus() {
    const statusEl = document.getElementById('game-status');

    if (this.gameOver) {
      if (this.winningCells.length > 0) {
        const winner = this.board[this.winningCells[0][0]][this.winningCells[0][1]];
        if (winner === 'X') {
          statusEl.textContent = 'Bạn thắng!';
          statusEl.className = 'game-status status-x';
        } else {
          statusEl.textContent = 'Bạn thua!';
          statusEl.className = 'game-status status-x';
        }
      } else {
        statusEl.textContent = 'Hòa!';
        statusEl.className = 'game-status status-draw';
      }
    } else if (this.aiThinking) {
      statusEl.textContent = 'AI đang suy nghĩ...';
      statusEl.className = 'game-status status-thinking';
    } else {
      statusEl.textContent = `Lượt của bạn (${this.currentPlayer})`;
      statusEl.className = 'game-status status-x';
    }
  }

  updateScoreboard() {
    document.getElementById('score-x').textContent = this.scores.x;
    document.getElementById('score-o').textContent = this.scores.o;
    document.getElementById('score-draw').textContent = this.scores.draw;
  }

  updateMoveHistory() {
    const listEl = document.getElementById('move-list');
    listEl.innerHTML = '';

    this.moveHistory.forEach((move, i) => {
      const item = document.createElement('span');
      item.className = `move-item move-${move.player.toLowerCase()}`;
      item.textContent = `${move.player}(${move.row + 1},${move.col + 1})`;
      listEl.appendChild(item);
    });

    listEl.scrollTop = listEl.scrollHeight;
  }

  // === GAME LOGIC ===

  bindEvents() {
    const boardEl = document.getElementById('board');

    // Remove old listener
    boardEl.replaceWith(boardEl.cloneNode(true));
    const newBoard = document.getElementById('board');

    newBoard.addEventListener('click', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell) return;

      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      this.playerMove(row, col);
    });

    // Restart buttons
    document.getElementById('btn-restart').onclick = () => this.restart();
    document.getElementById('btn-play-again').onclick = () => {
      this.hideGameOverOverlay();
      this.restart();
    };

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.dataset.difficulty;
        this.restart();
      });
    });
  }

  playerMove(row, col) {
    if (this.gameOver || this.aiThinking) return;
    if (this.board[row][col] !== '') return;
    if (this.currentPlayer !== 'X') return;

    this.makeMove(row, col, 'X');

    if (!this.gameOver) {
      this.currentPlayer = 'O';
      this.aiThinking = true;
      this.updateStatus();

      // AI move with slight delay for UX
      setTimeout(() => {
        this.aiMove();
        this.aiThinking = false;
        if (!this.gameOver) {
          this.currentPlayer = 'X';
        }
        this.updateStatus();
      }, 300 + Math.random() * 400);
    }
  }

  makeMove(row, col, player) {
    this.board[row][col] = player;
    this.clearLastMoveHighlight();
    this.lastMove = [row, col];
    this.moveHistory.push({ player, row, col });

    this.updateCell(row, col, true);
    this.updateMoveHistory();

    // Check win
    const win = this.checkWin(row, col, player);
    if (win) {
      this.winningCells = win;
      this.gameOver = true;
      this.highlightWin();
      this.updateStatus();

      if (player === 'X') {
        this.scores.x++;
        this.showGameOver('win');
      } else {
        this.scores.o++;
        this.showGameOver('lose');
      }
      this.saveScores();
      this.updateScoreboard();
      return;
    }

    // Check draw
    if (this.isBoardFull()) {
      this.gameOver = true;
      this.scores.draw++;
      this.saveScores();
      this.updateScoreboard();
      this.updateStatus();
      this.showGameOver('draw');
    }
  }

  checkWin(row, col, player) {
    const directions = [
      [0, 1],  // horizontal
      [1, 0],  // vertical
      [1, 1],  // diagonal \
      [1, -1]  // diagonal /
    ];

    for (const [dr, dc] of directions) {
      let cells = [[row, col]];

      // Count forward
      for (let i = 1; i < WIN_LENGTH; i++) {
        const nr = row + dr * i;
        const nc = col + dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && this.board[nr][nc] === player) {
          cells.push([nr, nc]);
        } else break;
      }

      // Count backward
      for (let i = 1; i < WIN_LENGTH; i++) {
        const nr = row - dr * i;
        const nc = col - dc * i;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && this.board[nr][nc] === player) {
          cells.push([nr, nc]);
        } else break;
      }

      if (cells.length >= WIN_LENGTH) {
        // Sort cells and return the winning 5
        cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        return cells.slice(0, WIN_LENGTH);
      }
    }

    return null;
  }

  isBoardFull() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.board[r][c] === '') return false;
      }
    }
    return true;
  }

  // === AI LOGIC ===

  aiMove() {
    const move = this.getBestMove();
    if (move) {
      this.makeMove(move[0], move[1], 'O');
    }
  }

  getBestMove() {
    // Get candidate moves (cells adjacent to existing pieces)
    const candidates = this.getCandidateMoves();

    if (candidates.length === 0) {
      // First move - play center
      return [Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)];
    }

    let bestScore = -Infinity;
    let bestMove = candidates[0];
    const depth = this.difficulty === 'easy' ? 1 : this.difficulty === 'medium' ? 2 : 3;

    for (const [r, c] of candidates) {
      // Quick scoring based on threat analysis
      const score = this.evaluateMove(r, c, 'O', depth);
      if (score > bestScore) {
        bestScore = score;
        bestMove = [r, c];
      }
    }

    return bestMove;
  }

  getCandidateMoves() {
    const candidates = new Set();
    const range = 2;

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (this.board[r][c] !== '') {
          for (let dr = -range; dr <= range; dr++) {
            for (let dc = -range; dc <= range; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && this.board[nr][nc] === '') {
                candidates.add(`${nr},${nc}`);
              }
            }
          }
        }
      }
    }

    return Array.from(candidates).map(s => s.split(',').map(Number));
  }

  evaluateMove(row, col, player, depth) {
    const opponent = player === 'O' ? 'X' : 'O';

    // Check immediate win
    this.board[row][col] = player;
    if (this.checkWin(row, col, player)) {
      this.board[row][col] = '';
      return 1000000;
    }

    // Check if opponent wins here (must block)
    this.board[row][col] = opponent;
    if (this.checkWin(row, col, opponent)) {
      this.board[row][col] = '';
      return 900000;
    }

    this.board[row][col] = '';

    // Heuristic scoring
    let score = 0;

    // Evaluate patterns for AI
    score += this.evaluatePosition(row, col, player) * 1.1;
    // Evaluate blocking opponent
    score += this.evaluatePosition(row, col, opponent) * 1.0;

    // Center preference
    const centerDist = Math.abs(row - BOARD_SIZE / 2) + Math.abs(col - BOARD_SIZE / 2);
    score += (BOARD_SIZE - centerDist) * 0.5;

    // Add randomness for easy difficulty
    if (this.difficulty === 'easy') {
      score += Math.random() * 50;
    }

    return score;
  }

  evaluatePosition(row, col, player) {
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
    let totalScore = 0;

    for (const [dr, dc] of directions) {
      const { count, openEnds, blocked } = this.countLine(row, col, dr, dc, player);

      if (blocked >= 2) continue;

      const open = openEnds;

      if (count >= 5) totalScore += 100000;
      else if (count === 4) {
        if (open >= 2) totalScore += 50000;
        else if (open === 1) totalScore += 5000;
      } else if (count === 3) {
        if (open >= 2) totalScore += 5000;
        else if (open === 1) totalScore += 500;
      } else if (count === 2) {
        if (open >= 2) totalScore += 500;
        else if (open === 1) totalScore += 50;
      } else if (count === 1) {
        if (open >= 2) totalScore += 10;
        else if (open === 1) totalScore += 5;
      }
    }

    return totalScore;
  }

  countLine(row, col, dr, dc, player) {
    let count = 1;
    let openEnds = 0;
    let blocked = 0;

    // Forward
    let fr = row + dr, fc = col + dc;
    while (fr >= 0 && fr < BOARD_SIZE && fc >= 0 && fc < BOARD_SIZE && this.board[fr][fc] === player) {
      count++;
      fr += dr;
      fc += dc;
    }
    if (fr >= 0 && fr < BOARD_SIZE && fc >= 0 && fc < BOARD_SIZE && this.board[fr][fc] === '') {
      openEnds++;
    } else {
      blocked++;
    }

    // Backward
    let br = row - dr, bc = col - dc;
    while (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE && this.board[br][bc] === player) {
      count++;
      br -= dr;
      bc -= dc;
    }
    if (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE && this.board[br][bc] === '') {
      openEnds++;
    } else {
      blocked++;
    }

    return { count, openEnds, blocked };
  }

  // === UI HELPERS ===

  showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }

  showGameOver(result) {
    const overlay = document.getElementById('game-over-overlay');
    const icon = document.getElementById('game-over-icon');
    const title = document.getElementById('game-over-title');
    const msg = document.getElementById('game-over-msg');

    if (result === 'win') {
      icon.textContent = '🎉';
      title.textContent = 'Bạn thắng!';
      title.className = 'game-over-title win';
      msg.textContent = 'Xuất sắc! Bạn đã đánh bại AI.';
    } else if (result === 'lose') {
      icon.textContent = '😞';
      title.textContent = 'Bạn thua!';
      title.className = 'game-over-title lose';
      msg.textContent = 'AI đã thắng. Hãy thử lại nhé!';
    } else {
      icon.textContent = '🤝';
      title.textContent = 'Hòa!';
      title.className = 'game-over-title draw';
      msg.textContent = 'Không ai thắng. Trận đấu rất cân!';
    }

    setTimeout(() => {
      overlay.classList.add('active');
    }, 800);
  }

  hideGameOverOverlay() {
    document.getElementById('game-over-overlay').classList.remove('active');
  }

  restart() {
    this.hideGameOverOverlay();
    this.init();
  }

  // === PERSISTENCE ===

  saveScores() {
    try {
      localStorage.setItem('caro_scores', JSON.stringify(this.scores));
    } catch (e) {}
  }

  loadScores() {
    try {
      const saved = localStorage.getItem('caro_scores');
      if (saved) {
        this.scores = JSON.parse(saved);
      }
    } catch (e) {}
    this.updateScoreboard();
  }
}

// === Initialize Game ===
document.addEventListener('DOMContentLoaded', () => {
  window.game = new CaroGame();
});
