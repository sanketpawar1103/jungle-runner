import { GameScoreState, GameState, VisualZone } from '../types';

export interface UIEventListeners {
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onMainMenu: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private listeners: UIEventListeners;

  // Screen elements
  private loadingScreen!: HTMLElement;
  private startScreen!: HTMLElement;
  private hudScreen!: HTMLElement;
  private pauseScreen!: HTMLElement;
  private gameOverScreen!: HTMLElement;
  private errorScreen!: HTMLElement;

  // Dynamic HUD elements
  private coinCountEl!: HTMLElement;
  private distanceEl!: HTMLElement;
  private zoneBadgeEl!: HTMLElement;
  private bestDistanceMenuEl!: HTMLElement;
  private finalDistanceEl!: HTMLElement;
  private finalCoinsEl!: HTMLElement;
  private finalBestEl!: HTMLElement;
  private newRecordBadgeEl!: HTMLElement;
  private gameOverReasonEl!: HTMLElement;
  private muteBtnHUD!: HTMLButtonElement;
  private muteBtnMenu!: HTMLButtonElement;
  private fullscreenBtnMenu!: HTMLButtonElement;
  private errorMessageEl!: HTMLElement;

  constructor(container: HTMLElement, listeners: UIEventListeners) {
    this.container = container;
    this.listeners = listeners;
    this.createUIElements();
  }

  private createUIElements(): void {
    this.container.innerHTML = `
      <!-- Loading Screen -->
      <div id="screen-loading" class="ui-screen active">
        <div class="screen-panel loading-panel">
          <div class="game-logo">
            <span class="logo-icon">🌿</span>
            <h1 class="game-title">JUNGLE RUNNER</h1>
            <span class="game-subtitle">TEMPLE ESCAPE</span>
          </div>
          <div class="spinner-container">
            <div class="jungle-spinner"></div>
            <p id="loading-status-text" class="loading-text">Preparing ancient ruins...</p>
          </div>
        </div>
      </div>

      <!-- Start Screen / Main Menu -->
      <div id="screen-menu" class="ui-screen">
        <div class="screen-panel menu-panel">
          <div class="game-logo">
            <span class="logo-icon">🗿</span>
            <h1 class="game-title">JUNGLE RUNNER</h1>
            <span class="game-subtitle">ANCIENT TEMPLE ESCAPE</span>
          </div>

          <div class="best-score-badge">
            <span class="badge-label">BEST DISTANCE</span>
            <span id="menu-best-distance" class="badge-val">0 m</span>
          </div>

          <button id="btn-start-game" class="btn btn-primary btn-large">
            <span class="btn-icon">▶</span> START RUN
          </button>

          <div class="controls-guide">
            <h3>KEYBOARD CONTROLS</h3>
            <div class="control-grid">
              <div class="control-item"><kbd>▲</kbd> <span>Jump over low hurdles</span></div>
              <div class="control-item"><kbd>▼</kbd> <span>Slide under overhead beams</span></div>
              <div class="control-item"><kbd>◄</kbd> <span>Switch lane Left</span></div>
              <div class="control-item"><kbd>►</kbd> <span>Switch lane Right</span></div>
              <div class="control-item full-width"><kbd>Esc</kbd> <span>Pause / Resume</span></div>
            </div>
            <p class="rule-warning">⚠️ Danger: Attempting to switch beyond the outer lanes triggers immediate game over!</p>
          </div>

          <div class="menu-utility-buttons">
            <button id="btn-menu-mute" class="btn btn-secondary" title="Toggle Sound">🔊 Sound: ON</button>
            <button id="btn-menu-fullscreen" class="btn btn-secondary" title="Toggle Fullscreen">⛶ Fullscreen</button>
          </div>
        </div>
      </div>

      <!-- In-Game HUD -->
      <div id="screen-hud" class="ui-hud">
        <div class="hud-top-left">
          <div class="hud-stat coins-stat">
            <span class="stat-icon">🪙</span>
            <span id="hud-coins" class="stat-val">0</span>
          </div>
          <div class="hud-stat distance-stat">
            <span class="stat-icon">🏃</span>
            <span id="hud-distance" class="stat-val">0 m</span>
          </div>
        </div>

        <div class="hud-top-center">
          <span id="hud-zone" class="zone-badge">LUSH JUNGLE</span>
        </div>

        <div class="hud-top-right">
          <button id="btn-hud-mute" class="hud-icon-btn" title="Toggle Mute" aria-label="Mute">🔊</button>
          <button id="btn-hud-pause" class="hud-icon-btn" title="Pause Game (Esc)" aria-label="Pause">⏸</button>
        </div>
      </div>

      <!-- Pause Screen -->
      <div id="screen-pause" class="ui-screen modal-overlay">
        <div class="screen-panel pause-panel">
          <h2>GAME PAUSED</h2>
          <p class="pause-hint">Simulation is fully frozen</p>
          <div class="pause-actions">
            <button id="btn-resume-game" class="btn btn-primary btn-large">RESUME (ESC)</button>
            <button id="btn-pause-menu" class="btn btn-secondary">MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- Game Over Screen -->
      <div id="screen-game-over" class="ui-screen modal-overlay">
        <div class="screen-panel game-over-panel">
          <h2 class="game-over-title">EXPEDITION FAILED</h2>
          <p id="game-over-reason" class="death-reason">You were trapped in the jungle!</p>

          <div class="run-results-card">
            <div id="new-record-badge" class="new-record-tag" style="display: none;">🏆 NEW BEST RECORD!</div>
            <div class="result-row">
              <span class="res-label">Distance Travelled:</span>
              <span id="final-distance" class="res-value highlight">0 m</span>
            </div>
            <div class="result-row">
              <span class="res-label">Coins Collected:</span>
              <span id="final-coins" class="res-value">0</span>
            </div>
            <div class="result-row">
              <span class="res-label">All-Time Best:</span>
              <span id="final-best" class="res-value">0 m</span>
            </div>
          </div>

          <div class="game-over-actions">
            <button id="btn-play-again" class="btn btn-primary btn-large">PLAY AGAIN</button>
            <button id="btn-game-over-menu" class="btn btn-secondary">MAIN MENU</button>
          </div>
        </div>
      </div>

      <!-- Error Screen -->
      <div id="screen-error" class="ui-screen modal-overlay">
        <div class="screen-panel error-panel">
          <h2>INITIALIZATION ERROR</h2>
          <p id="error-message" class="error-text">Could not load 3D graphics environment.</p>
          <button id="btn-retry-init" class="btn btn-primary">RETRY</button>
        </div>
      </div>
    `;

    // Cache elements
    this.loadingScreen = this.container.querySelector('#screen-loading')!;
    this.startScreen = this.container.querySelector('#screen-menu')!;
    this.hudScreen = this.container.querySelector('#screen-hud')!;
    this.pauseScreen = this.container.querySelector('#screen-pause')!;
    this.gameOverScreen = this.container.querySelector('#screen-game-over')!;
    this.errorScreen = this.container.querySelector('#screen-error')!;

    this.coinCountEl = this.container.querySelector('#hud-coins')!;
    this.distanceEl = this.container.querySelector('#hud-distance')!;
    this.zoneBadgeEl = this.container.querySelector('#hud-zone')!;
    this.bestDistanceMenuEl = this.container.querySelector('#menu-best-distance')!;

    this.finalDistanceEl = this.container.querySelector('#final-distance')!;
    this.finalCoinsEl = this.container.querySelector('#final-coins')!;
    this.finalBestEl = this.container.querySelector('#final-best')!;
    this.newRecordBadgeEl = this.container.querySelector('#new-record-badge')!;
    this.gameOverReasonEl = this.container.querySelector('#game-over-reason')!;

    this.muteBtnHUD = this.container.querySelector('#btn-hud-mute')!;
    this.muteBtnMenu = this.container.querySelector('#btn-menu-mute')!;
    this.fullscreenBtnMenu = this.container.querySelector('#btn-menu-fullscreen')!;
    this.errorMessageEl = this.container.querySelector('#error-message')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Start game button
    const startBtn = this.container.querySelector('#btn-start-game');
    startBtn?.addEventListener('click', () => this.listeners.onStartGame());

    // Resume game button
    const resumeBtn = this.container.querySelector('#btn-resume-game');
    resumeBtn?.addEventListener('click', () => this.listeners.onResumeGame());

    // HUD Pause button
    const hudPauseBtn = this.container.querySelector('#btn-hud-pause');
    hudPauseBtn?.addEventListener('click', () => this.listeners.onResumeGame());

    // Play again button
    const playAgainBtn = this.container.querySelector('#btn-play-again');
    playAgainBtn?.addEventListener('click', () => this.listeners.onRestartGame());

    // Main menu buttons
    const pauseMenuBtn = this.container.querySelector('#btn-pause-menu');
    pauseMenuBtn?.addEventListener('click', () => this.listeners.onMainMenu());

    const gameOverMenuBtn = this.container.querySelector('#btn-game-over-menu');
    gameOverMenuBtn?.addEventListener('click', () => this.listeners.onMainMenu());

    // Mute buttons
    this.muteBtnHUD.addEventListener('click', () => this.listeners.onToggleMute());
    this.muteBtnMenu.addEventListener('click', () => this.listeners.onToggleMute());

    // Fullscreen button
    this.fullscreenBtnMenu.addEventListener('click', () => this.listeners.onToggleFullscreen());

    // Error retry
    const retryBtn = this.container.querySelector('#btn-retry-init');
    retryBtn?.addEventListener('click', () => window.location.reload());
  }

  public setGameState(state: GameState): void {
    this.loadingScreen.classList.remove('active');
    this.startScreen.classList.remove('active');
    this.hudScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.gameOverScreen.classList.remove('active');
    this.errorScreen.classList.remove('active');

    switch (state) {
      case 'LOADING':
        this.loadingScreen.classList.add('active');
        break;
      case 'MENU':
        this.startScreen.classList.add('active');
        break;
      case 'RUNNING':
        this.hudScreen.classList.add('active');
        break;
      case 'PAUSED':
        this.hudScreen.classList.add('active');
        this.pauseScreen.classList.add('active');
        break;
      case 'GAME_OVER':
        this.gameOverScreen.classList.add('active');
        break;
      case 'ERROR':
        this.errorScreen.classList.add('active');
        break;
    }
  }

  public updateHUD(score: GameScoreState, zoneName: VisualZone): void {
    this.coinCountEl.textContent = score.coins.toString();
    this.distanceEl.textContent = `${Math.floor(score.distance)} m`;

    let formattedZone = 'LUSH JUNGLE';
    if (zoneName === 'TEMPLE_RUINS') formattedZone = 'TEMPLE RUINS';
    if (zoneName === 'STONE_PASSAGES') formattedZone = 'STONE PASSAGES';
    this.zoneBadgeEl.textContent = formattedZone;
  }

  public updateBestDistance(bestDistance: number): void {
    this.bestDistanceMenuEl.textContent = `${Math.floor(bestDistance)} m`;
  }

  public showGameOver(
    score: GameScoreState,
    reason: string,
    isNewRecord: boolean
  ): void {
    this.finalDistanceEl.textContent = `${Math.floor(score.distance)} m`;
    this.finalCoinsEl.textContent = score.coins.toString();
    this.finalBestEl.textContent = `${Math.floor(score.bestDistance)} m`;
    this.gameOverReasonEl.textContent = reason;
    this.newRecordBadgeEl.style.display = isNewRecord ? 'block' : 'none';
    this.setGameState('GAME_OVER');
  }

  public setMuteState(isMuted: boolean): void {
    const icon = isMuted ? '🔇' : '🔊';
    const text = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    this.muteBtnHUD.textContent = icon;
    this.muteBtnMenu.textContent = text;
  }

  public showError(msg: string): void {
    this.errorMessageEl.textContent = msg;
    this.setGameState('ERROR');
  }
}
