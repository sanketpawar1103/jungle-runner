import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIManager } from '../src/ui/hud';

describe('UIManager and Game State Transitions', () => {
  let container: HTMLElement;
  let startMock = vi.fn(() => {});
  let resumeMock = vi.fn(() => {});
  let restartMock = vi.fn(() => {});
  let menuMock = vi.fn(() => {});
  let muteMock = vi.fn(() => {});
  let fullscreenMock = vi.fn(() => {});
  let ui: UIManager;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    startMock = vi.fn(() => {});
    resumeMock = vi.fn(() => {});
    restartMock = vi.fn(() => {});
    menuMock = vi.fn(() => {});
    muteMock = vi.fn(() => {});
    fullscreenMock = vi.fn(() => {});

    ui = new UIManager(container, {
      onStartGame: startMock,
      onResumeGame: resumeMock,
      onRestartGame: restartMock,
      onMainMenu: menuMock,
      onToggleMute: muteMock,
      onToggleFullscreen: fullscreenMock,
    });
  });

  it('should activate appropriate screens based on game state', () => {
    const loadingScreen = container.querySelector('#screen-loading')!;
    const menuScreen = container.querySelector('#screen-menu')!;
    const hudScreen = container.querySelector('#screen-hud')!;
    const pauseScreen = container.querySelector('#screen-pause')!;
    const gameOverScreen = container.querySelector('#screen-game-over')!;

    // 1. LOADING
    ui.setGameState('LOADING');
    expect(loadingScreen.classList.contains('active')).toBe(true);
    expect(menuScreen.classList.contains('active')).toBe(false);

    // 2. MENU
    ui.setGameState('MENU');
    expect(menuScreen.classList.contains('active')).toBe(true);
    expect(loadingScreen.classList.contains('active')).toBe(false);

    // 3. RUNNING
    ui.setGameState('RUNNING');
    expect(hudScreen.classList.contains('active')).toBe(true);
    expect(menuScreen.classList.contains('active')).toBe(false);

    // 4. PAUSED
    ui.setGameState('PAUSED');
    expect(hudScreen.classList.contains('active')).toBe(true);
    expect(pauseScreen.classList.contains('active')).toBe(true);

    // 5. GAME_OVER
    ui.setGameState('GAME_OVER');
    expect(gameOverScreen.classList.contains('active')).toBe(true);
    expect(pauseScreen.classList.contains('active')).toBe(false);
  });

  it('should update HUD numbers correctly', () => {
    ui.updateHUD({ distance: 154.2, coins: 18, bestDistance: 250 }, 'LUSH_JUNGLE');

    const coinsEl = container.querySelector('#hud-coins')!;
    const distEl = container.querySelector('#hud-distance')!;
    const zoneEl = container.querySelector('#hud-zone')!;

    expect(coinsEl.textContent).toBe('18');
    expect(distEl.textContent).toBe('154 m');
    expect(zoneEl.textContent).toBe('LUSH JUNGLE');
  });

  it('should trigger onStartGame when clicking Start Run button', () => {
    const startBtn = container.querySelector<HTMLButtonElement>('#btn-start-game')!;
    startBtn.click();
    expect(startMock).toHaveBeenCalledOnce();
  });

  it('should display game over details and new record badge when applicable', () => {
    ui.showGameOver(
      { distance: 350.7, coins: 25, bestDistance: 350 },
      'Hit a stone wall!',
      true
    );

    const reasonEl = container.querySelector('#game-over-reason')!;
    const finalDistEl = container.querySelector('#final-distance')!;
    const finalCoinsEl = container.querySelector('#final-coins')!;
    const newRecordBadge = container.querySelector<HTMLElement>('#new-record-badge')!;

    expect(reasonEl.textContent).toBe('Hit a stone wall!');
    expect(finalDistEl.textContent).toBe('350 m');
    expect(finalCoinsEl.textContent).toBe('25');
    expect(newRecordBadge.style.display).toBe('block');
  });
});
