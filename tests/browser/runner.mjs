import { chromium } from 'playwright';
import { createServer } from 'vite';

async function runBrowserTests() {
  console.log('--- Starting Playwright Browser Verification ---');

  // 1. Launch Vite local server programmatically
  const server = await createServer({
    configFile: './vite.config.ts',
    server: { port: 3100 },
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === 'object' && address ? address.port : 3100;
  const url = `http://localhost:${port}`;
  console.log(`Vite server running at ${url}`);

  // 2. Launch Google Chrome browser
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => consoleLogs.push(`[Browser ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', (err) => console.error('[Browser Exception]:', err));

  try {
    // 3. Navigate to game
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // 4. Verify title and start menu
    const title = await page.title();
    console.log(`Page title: "${title}"`);
    if (!title.includes('Jungle Runner')) {
      throw new Error(`Unexpected page title: ${title}`);
    }

    const menuActive = await page.evaluate(() => {
      const menu = document.querySelector('#screen-menu');
      return menu ? menu.classList.contains('active') : false;
    });
    console.log(`Start menu active on load: ${menuActive}`);
    if (!menuActive) throw new Error('Start screen is not active on initial load!');

    const canvasExists = await page.evaluate(() => {
      const c = document.querySelector('#game-canvas');
      return !!c && c.width > 0 && c.height > 0;
    });
    console.log(`WebGL Canvas initialized: ${canvasExists}`);
    if (!canvasExists) throw new Error('Game canvas was not found or has 0 dimensions!');

    // 5. Start Game
    console.log('Clicking Start Game button...');
    await page.click('#btn-start-game');

    // Wait for HUD to become active
    await page.waitForFunction(() => {
      const hud = document.querySelector('#screen-hud');
      return hud && hud.classList.contains('active');
    });
    console.log('HUD is active, gameplay running!');

    // 6. Wait 1 second to accumulate distance
    await page.waitForTimeout(1000);

    const distanceVal = await page.evaluate(() => {
      const distEl = document.querySelector('#hud-distance');
      return distEl ? distEl.textContent : '';
    });
    console.log(`Accumulated distance after 1s: ${distanceVal}`);
    const distNum = parseInt(distanceVal || '0', 10);
    if (distNum <= 0) {
      throw new Error(`Distance did not accumulate during gameplay: ${distanceVal}`);
    }

    // 7. Test In-Game Keyboard Inputs
    console.log('Testing ArrowUp (Jump)...');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);

    console.log('Testing ArrowDown (Slide)...');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // 8. Test Pause with Escape
    console.log('Testing Pause via Escape key...');
    await page.keyboard.press('Escape');

    const pauseActive = await page.evaluate(() => {
      const p = document.querySelector('#screen-pause');
      return p && p.classList.contains('active');
    });
    console.log(`Pause screen active: ${pauseActive}`);
    if (!pauseActive) throw new Error('Pause overlay did not appear on Escape!');

    const pausedDistance = await page.evaluate(() => {
      return document.querySelector('#hud-distance')?.textContent;
    });

    // Wait 500ms while paused and verify distance didn't change
    await page.waitForTimeout(500);
    const distanceAfterPause = await page.evaluate(() => {
      return document.querySelector('#hud-distance')?.textContent;
    });
    console.log(`Distance while paused: ${distanceAfterPause} (was ${pausedDistance})`);
    if (pausedDistance !== distanceAfterPause) {
      throw new Error('Distance accumulated while paused!');
    }

    // Resume via Escape
    console.log('Resuming via Escape...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const isRunningAgain = await page.evaluate(() => {
      const p = document.querySelector('#screen-pause');
      return p && !p.classList.contains('active');
    });
    console.log(`Pause screen dismissed: ${isRunningAgain}`);
    if (!isRunningAgain) throw new Error('Failed to resume from pause!');

    // 9. Test Mandatory Lane Boundary Game Over
    console.log('Testing mandatory lane boundary death (Left into Left outer edge)...');
    await page.keyboard.press('ArrowLeft'); // Middle -> Left
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowLeft'); // Left -> Out of bounds!
    await page.waitForTimeout(300);

    const gameOverActive = await page.evaluate(() => {
      const go = document.querySelector('#screen-game-over');
      return go && go.classList.contains('active');
    });
    console.log(`Game Over screen active: ${gameOverActive}`);
    if (!gameOverActive) throw new Error('Game Over screen did not activate on lane boundary violation!');

    const deathReason = await page.evaluate(() => {
      return document.querySelector('#game-over-reason')?.textContent;
    });
    console.log(`Death reason displayed: "${deathReason}"`);

    // 10. Test Play Again
    console.log('Testing Play Again button...');
    await page.click('#btn-play-again');
    await page.waitForTimeout(300);

    const hudActiveAgain = await page.evaluate(() => {
      const hud = document.querySelector('#screen-hud');
      const go = document.querySelector('#screen-game-over');
      return hud?.classList.contains('active') && !go?.classList.contains('active');
    });
    console.log(`New run started via Play Again: ${hudActiveAgain}`);
    if (!hudActiveAgain) throw new Error('Play Again failed to restart a fresh run!');

    console.log('--- ALL BROWSER CHECKS PASSED SUCCESSFULLY! ---');
  } finally {
    await browser.close();
    await server.close();
  }
}

runBrowserTests().catch((err) => {
  console.error('Browser Test Failed:', err);
  process.exit(1);
});
