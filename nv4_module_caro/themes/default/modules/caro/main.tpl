<!-- BEGIN: main -->
<style>
/* Remove inline styles completely since they interfere with the theme */
</style>
 
<div class="caro-container">
  <div class="container-inner">
    <!-- Title -->
    <h1 class="game-title">{LANG.main_title}</h1>
    <p class="game-subtitle">{LANG.subtitle}</p>

    <!-- Difficulty -->
    <div class="difficulty-section">
      <div class="difficulty-label">{LANG.difficulty}</div>
      <div class="difficulty-options">
        <button class="diff-btn" data-difficulty="easy">{LANG.diff_easy}</button>
        <button class="diff-btn active" data-difficulty="medium">{LANG.diff_medium}</button>
        <button class="diff-btn" data-difficulty="hard">{LANG.diff_hard}</button>
      </div>
    </div>

    <!-- Header Bar -->
    <div class="header-bar">
      <div class="game-status status-x" id="game-status">{LANG.status_your_turn}</div>
      <button class="btn-restart" id="btn-restart">{LANG.restart}</button>
    </div>



    <!-- Board -->
    <div class="board-wrapper" id="board-wrapper">
      <div class="board-inner-wrapper">
        <div class="loading-overlay" id="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
        <div class="board" id="board"></div>
      </div>
    </div>
    <!-- Scoreboard -->
    <div class="scoreboard">
      <div class="score-card score-x">
        <div class="score-label">{LANG.score_you}</div>
        <div class="score-value" id="score-x">0</div>
      </div>
      <div class="score-card score-draw">
        <div class="score-label">{LANG.score_draw}</div>
        <div class="score-value" id="score-draw">0</div>
      </div>
      <div class="score-card score-o">
        <div class="score-label">{LANG.score_ai}</div>
        <div class="score-value" id="score-o">0</div>
      </div>
    </div>
    <!-- Move History -->
    <div class="move-history">
      <div class="move-history-title">{LANG.move_history}</div>
      <div class="move-list" id="move-list"></div>
    </div>
  </div>

  <!-- Game Over Overlay -->
  <div class="game-over-overlay" id="game-over-overlay">
    <div class="game-over-card">
      <div class="game-over-icon" id="game-over-icon">🎉</div>
      <h2 class="game-over-title win" id="game-over-title">{LANG.status_win}</h2>
      <p class="game-over-msg" id="game-over-msg">{LANG.msg_win}</p>
      <div class="game-over-btns">
        <button class="btn-play-again" id="btn-play-again">{LANG.restart}</button>
      </div>
    </div>
  </div>
</div>

<script>
  // Pass NukeViet variables to JS
  var nv_api_url = "{API_URL}";
</script>
<!-- END: main -->
