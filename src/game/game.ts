import * as THREE from 'three';
import { CONFIG, getZoneForDistance } from '../config';
import { GameScoreState, GameState, VisualZone } from '../types';
import { storageManager } from '../utils/storage';
import { soundManager } from '../audio/sound-manager';
import { Player } from './player';
import { TrackManager } from './track';
import { ObstaclePool } from './obstacles';
import { CoinPool } from './coins';
import { WorldSpawner } from './spawner';
import { collisionSystem } from './collision';
import { UIManager } from '../ui/hud';

export class Game {
  public state: GameState = 'LOADING';

  // Three.js core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private canvas: HTMLCanvasElement;

  // Cinematic Environmental Effects
  private sunbeamsGroup: THREE.Group;
  private sporeParticles: THREE.Points;
  private particlePositions: Float32Array;

  // Subsystems
  private player: Player;
  private trackManager: TrackManager;
  private obstaclePool: ObstaclePool;
  private coinPool: CoinPool;
  private spawner: WorldSpawner;
  private uiManager!: UIManager;

  // Run progress state
  private distance: number = 0;
  private coins: number = 0;
  private speed: number = CONFIG.SPEED.INITIAL;
  private currentZone: VisualZone = 'LUSH_JUNGLE';
  private bestDistance: number = 0;

  // Game loop & timing
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private isDisposed: boolean = false;

  // Event handler references
  private handleKeyDownBound: (e: KeyboardEvent) => void;
  private handleResizeBound: () => void;
  private handleVisibilityChangeBound: () => void;

  constructor(canvas: HTMLCanvasElement, uiContainer: HTMLElement) {
    this.canvas = canvas;

    // 1. Scene & Camera setup
    this.scene = new THREE.Scene();
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, aspect, CONFIG.CAMERA.NEAR, CONFIG.CAMERA.FAR);
    this.camera.position.set(0, CONFIG.CAMERA.OFFSET_Y, CONFIG.CAMERA.OFFSET_Z);
    this.camera.lookAt(0, CONFIG.CAMERA.LOOK_AT_Y, CONFIG.CAMERA.LOOK_AT_Z);

    // Cinematic fog
    const initialZoneConfig = CONFIG.ZONES.LUSH_JUNGLE;
    this.scene.fog = new THREE.FogExp2(initialZoneConfig.fogColor, initialZoneConfig.fogDensity);

    // 2. Lighting setup
    // Sky/ground hemisphere for realistic ambient bounce — sky warm gold, ground deep moss green
    const hemisphereLight = new THREE.HemisphereLight(0xffe4a0, 0x2a4a18, 0.75);
    this.scene.add(hemisphereLight);

    this.ambientLight = new THREE.AmbientLight(initialZoneConfig.ambientColor, initialZoneConfig.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(initialZoneConfig.sunColor, initialZoneConfig.sunIntensity);
    this.dirLight.position.set(18, 38, 22);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 120;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 25;
    this.dirLight.shadow.camera.bottom = -12;
    this.scene.add(this.dirLight);

    // Cool blue-violet rim/fill light from behind-left for cinematic depth on character skin
    const rimLight = new THREE.DirectionalLight(0x88aaff, 0.55);
    rimLight.position.set(-12, 8, 10);
    this.scene.add(rimLight);

    // Warm secondary fill from below canopy — simulates light bouncing off the ground foliage
    const fillLight = new THREE.PointLight(0x6fcf50, 0.7, 28);
    fillLight.position.set(0, 0.8, -6);
    this.scene.add(fillLight);

    // 3. WebGL Renderer with ACES Filmic Tone Mapping for cinematic color response
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Volumetric Sunbeams / Crepuscular God Rays (matching reference image)
    this.sunbeamsGroup = this.createSunbeams();
    this.scene.add(this.sunbeamsGroup);

    // 5. Airborne Jungle Spore Particle System
    const particleData = this.createSporeParticles();
    this.sporeParticles = particleData.points;
    this.particlePositions = particleData.positions;
    this.scene.add(this.sporeParticles);

    // 6. Instantiate gameplay subsystems
    this.player = new Player({
      onGameOver: (reason) => this.handleGameOver(reason),
      onLaneSwitch: () => soundManager.playLaneSwitch(),
      onJump: () => soundManager.playJump(),
      onSlide: () => soundManager.playSlide(),
    });
    this.scene.add(this.player.mesh);

    this.trackManager = new TrackManager(this.scene);
    this.obstaclePool = new ObstaclePool(this.scene, 12);
    this.coinPool = new CoinPool(this.scene, CONFIG.COINS.POOL_SIZE);
    this.spawner = new WorldSpawner(this.scene, this.obstaclePool, this.coinPool);

    // 7. Read persisted best distance
    this.bestDistance = storageManager.getBestDistance();

    // 8. UI Manager initialization
    this.uiManager = new UIManager(uiContainer, {
      onStartGame: () => this.handleStartGame(),
      onResumeGame: () => this.togglePause(),
      onRestartGame: () => this.handleStartGame(),
      onMainMenu: () => this.goToMenu(),
      onToggleMute: () => this.toggleMute(),
      onToggleFullscreen: () => this.toggleFullscreen(),
    });

    this.uiManager.updateBestDistance(this.bestDistance);

    // 9. Bind window & keyboard listeners
    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleResizeBound = this.handleResize.bind(this);
    this.handleVisibilityChangeBound = this.handleVisibilityChange.bind(this);

    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('resize', this.handleResizeBound);
    document.addEventListener('visibilitychange', this.handleVisibilityChangeBound);

    // Start in MENU state
    this.setGameState('MENU');

    // Start render loop
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.renderLoop.bind(this));
  }

  /**
   * Creates atmospheric volumetric sunbeam shafts streaming from above the canopy.
   */
  private createSunbeams(): THREE.Group {
    const group = new THREE.Group();
    const beamGeo = new THREE.CylinderGeometry(0.8, 4.2, 45, 10, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffea9f,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    for (let i = 0; i < 6; i++) {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(-8 + i * 3.4, 18, -20 - i * 14);
      beam.rotation.z = 0.28;
      beam.rotation.x = -0.18;
      group.add(beam);
    }

    return group;
  }

  /**
   * Creates floating airborne spore/pollen particles illuminated by sunlight.
   */
  private createSporeParticles(): { points: THREE.Points; positions: Float32Array } {
    const count = 180;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = 0.5 + Math.random() * 8; // y
      positions[i * 3 + 2] = -Math.random() * 80; // z
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffe899,
      size: 0.14,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    return { points, positions };
  }

  public setGameState(newState: GameState): void {
    this.state = newState;
    this.uiManager.setGameState(newState);

    if (newState === 'RUNNING') {
      soundManager.startMusic();
    } else {
      soundManager.stopMusic();
    }
  }

  private async handleStartGame(): Promise<void> {
    soundManager.playClick();
    await soundManager.initAudio();

    this.distance = 0;
    this.coins = 0;
    this.speed = CONFIG.SPEED.INITIAL;
    this.currentZone = 'LUSH_JUNGLE';

    this.player.reset();
    this.trackManager.reset('LUSH_JUNGLE');
    this.obstaclePool.reset();
    this.coinPool.reset();
    this.spawner.reset();

    this.applyZoneEnvironment('LUSH_JUNGLE', true);
    this.uiManager.updateHUD(this.getScoreState(), 'LUSH_JUNGLE');

    this.setGameState('RUNNING');
  }

  public togglePause(): void {
    if (this.state === 'RUNNING') {
      soundManager.playClick();
      this.setGameState('PAUSED');
    } else if (this.state === 'PAUSED') {
      soundManager.playClick();
      this.lastTime = performance.now();
      this.setGameState('RUNNING');
    }
  }

  private goToMenu(): void {
    soundManager.playClick();
    this.bestDistance = storageManager.getBestDistance();
    this.uiManager.updateBestDistance(this.bestDistance);
    this.setGameState('MENU');
  }

  private toggleMute(): void {
    const isMuted = soundManager.toggleMute();
    this.uiManager.setMuteState(isMuted);
  }

  private async toggleFullscreen(): Promise<void> {
    soundManager.playClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed or was dismissed:', e);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'Escape') {
      e.preventDefault();
      if (this.state === 'RUNNING' || this.state === 'PAUSED') {
        this.togglePause();
      }
      return;
    }

    if (this.state !== 'RUNNING') {
      return;
    }

    if (e.repeat) {
      return;
    }

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        this.player.handleJump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        this.player.handleSlide();
        break;
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        this.player.handleLeft();
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        this.player.handleRight();
        break;
    }
  }

  private handleVisibilityChange(): void {
    if (document.hidden && this.state === 'RUNNING') {
      this.setGameState('PAUSED');
    }
  }

  private renderLoop(timestamp: number): void {
    if (this.isDisposed) return;

    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    const dt = Math.min(rawDt, CONFIG.SPEED.MAX_DELTA_TIME);

    if (this.state === 'RUNNING') {
      this.updateSimulation(dt);
    } else if (this.state === 'GAME_OVER') {
      this.player.update(dt, this.speed);
    }

    // Animate spore motes floating gently
    this.updateSporeParticles(dt);

    // Smooth camera tracking
    this.updateCamera(dt);

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);

    this.animationFrameId = requestAnimationFrame(this.renderLoop.bind(this));
  }

  private updateSporeParticles(dt: number): void {
    const pos = this.particlePositions;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] -= dt * 0.4; // slowly drift down
      pos[i] += Math.sin(pos[i + 2] + pos[i + 1]) * dt * 0.15; // gentle breeze
      if (pos[i + 1] < 0.2) {
        pos[i + 1] = 7.5; // cycle to top
      }
    }
    this.sporeParticles.geometry.attributes.position.needsUpdate = true;
  }

  private updateSimulation(dt: number): void {
    // 1. Progressive speed increase up to MAX_SPEED
    if (this.speed < CONFIG.SPEED.MAX) {
      this.speed = Math.min(CONFIG.SPEED.MAX, this.speed + CONFIG.SPEED.ACCELERATION * dt);
    }

    // 2. Track distance traveled
    const deltaMove = this.speed * dt;
    this.distance += deltaMove;

    // 3. Update Visual Zone according to current distance
    const newZone = getZoneForDistance(this.distance);
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
      this.applyZoneEnvironment(newZone, false);
    }

    // 4. Update Player
    this.player.update(dt, this.speed);

    if (!this.player.isAlive) {
      return;
    }

    // 5. Update World & Track
    this.trackManager.update(deltaMove, this.currentZone);
    this.spawner.update(deltaMove, this.speed);
    this.coinPool.update(dt);

    // 6. Collision Detection
    const playerCol = this.player.getCollisionState();

    // Check Obstacles
    const activeObstacles = this.obstaclePool.getActiveObstacles();
    for (const obs of activeObstacles) {
      if (collisionSystem.checkPlayerObstacle(playerCol, obs.getInstance())) {
        this.player.kill(this.getObstacleDeathReason(obs.type));
        return;
      }
    }

    // Check Coins
    const activeCoins = this.coinPool.getActiveCoins();
    for (const coin of activeCoins) {
      if (collisionSystem.checkPlayerCoin(playerCol, coin.getInstance())) {
        coin.markCollected();
        this.coins++;
        soundManager.playCoin();
      }
    }

    // 7. Update Live HUD
    this.uiManager.updateHUD(this.getScoreState(), this.currentZone);
  }

  private updateCamera(dt: number): void {
    const targetCamX = this.player.x * 0.45;
    this.camera.position.x = THREE.MathUtils.damp(
      this.camera.position.x,
      targetCamX,
      CONFIG.CAMERA.SMOOTH_X_FACTOR,
      dt
    );

    const targetCamY = CONFIG.CAMERA.OFFSET_Y + this.player.y * 0.2;
    this.camera.position.y = THREE.MathUtils.damp(
      this.camera.position.y,
      targetCamY,
      CONFIG.CAMERA.SMOOTH_Y_FACTOR,
      dt
    );

    this.camera.lookAt(targetCamX * 0.3, CONFIG.CAMERA.LOOK_AT_Y + this.player.y * 0.1, CONFIG.CAMERA.LOOK_AT_Z);
  }

  private applyZoneEnvironment(zone: VisualZone, immediate: boolean): void {
    const zoneConfig = CONFIG.ZONES[zone];

    if (immediate) {
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(zoneConfig.fogColor);
        this.scene.fog.density = zoneConfig.fogDensity;
      }
      this.ambientLight.color.setHex(zoneConfig.ambientColor);
      this.ambientLight.intensity = zoneConfig.ambientIntensity;
      this.dirLight.color.setHex(zoneConfig.sunColor);
      this.dirLight.intensity = zoneConfig.sunIntensity;
    } else {
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.lerp(new THREE.Color(zoneConfig.fogColor), 0.08);
      }
      this.ambientLight.color.lerp(new THREE.Color(zoneConfig.ambientColor), 0.08);
      this.dirLight.color.lerp(new THREE.Color(zoneConfig.sunColor), 0.08);
    }
  }

  private getObstacleDeathReason(type: string): string {
    switch (type) {
      case 'LOW':
        return 'Tripped over an ancient fallen jungle log!';
      case 'OVERHEAD':
        return 'Collided with an ancient stone temple lintel!';
      case 'FULL_BLOCK':
        return 'Smashed into a carved stone ruin totem!';
      default:
        return 'Collided with an ancient obstacle!';
    }
  }

  private handleGameOver(reason: string): void {
    if (this.state === 'GAME_OVER') return;

    soundManager.playCrash();
    soundManager.stopMusic();

    const previousBest = this.bestDistance;
    const isNewRecord = this.distance > previousBest;
    this.bestDistance = storageManager.updateBestDistance(this.distance);

    const finalScore = this.getScoreState();
    this.uiManager.showGameOver(finalScore, reason, isNewRecord);
    this.setGameState('GAME_OVER');
  }

  private getScoreState(): GameScoreState {
    return {
      distance: this.distance,
      coins: this.coins,
      bestDistance: this.bestDistance,
    };
  }

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('resize', this.handleResizeBound);
    document.removeEventListener('visibilitychange', this.handleVisibilityChangeBound);

    this.trackManager.dispose();
    this.obstaclePool.dispose(this.scene);
    this.coinPool.dispose(this.scene);
    soundManager.dispose();
    this.renderer.dispose();
  }
}
