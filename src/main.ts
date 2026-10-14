import './style.css';
import { Game } from './game/game';

function initApp(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
  const uiContainer = document.querySelector<HTMLElement>('#ui-container');

  if (!canvas || !uiContainer) {
    console.error('Initialization error: Missing #game-canvas or #ui-container DOM element.');
    return;
  }

  try {
    // Instantiate game and its systems
    new Game(canvas, uiContainer);
  } catch (err) {
    console.error('Fatal initialization error starting Jungle Runner:', err);
    uiContainer.innerHTML = `
      <div class="ui-screen active modal-overlay">
        <div class="screen-panel error-panel">
          <h2>GRAPHICS INITIALIZATION FAILED</h2>
          <p class="error-text">Could not create WebGL 3D context. Please verify that hardware acceleration is enabled in your browser.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">RELOAD</button>
        </div>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
