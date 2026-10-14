import * as THREE from 'three';
import { CONFIG } from '../config';
import { Lane, LANE, ObstacleType, OBSTACLE_TYPE } from '../types';
import { CoinPool } from './coins';
import { ObstaclePool } from './obstacles';

export class WorldSpawner {
  private obstaclePool: ObstaclePool;
  private coinPool: CoinPool;
  private scene: THREE.Scene;

  private nextObstacleZ: number = -CONFIG.OBSTACLES.INITIAL_SAFE_DISTANCE;
  private nextCoinZ: number = -15.0;

  constructor(scene: THREE.Scene, obstaclePool: ObstaclePool, coinPool: CoinPool) {
    this.scene = scene;
    this.obstaclePool = obstaclePool;
    this.coinPool = coinPool;
    this.reset();
  }

  public reset(): void {
    this.nextObstacleZ = -CONFIG.OBSTACLES.INITIAL_SAFE_DISTANCE;
    this.nextCoinZ = -15.0;
  }

  /**
   * Updates obstacle and coin positions moving in +Z (toward player).
   * Spawns new obstacles and coins ahead at spawn boundary.
   * Recycles passed objects when z > DESPAWN_Z.
   */
  public update(deltaMove: number, currentSpeed: number): void {
    const despawnZ = CONFIG.WORLD.DESPAWN_Z;

    // 1. Advance all active obstacles
    for (const obs of this.obstaclePool.allObstacles) {
      if (obs.active) {
        obs.z += deltaMove;
        obs.mesh.position.z = obs.z;
        if (obs.z > despawnZ) {
          obs.deactivate();
        }
      }
    }

    // 2. Advance all active coins
    for (const coin of this.coinPool.pool) {
      if (coin.active) {
        coin.z += deltaMove;
        coin.mesh.position.z = coin.z;
        if (coin.z > despawnZ) {
          coin.deactivate();
        }
      }
    }

    // Advance spawn thresholds
    this.nextObstacleZ += deltaMove;
    this.nextCoinZ += deltaMove;

    // 3. Spawn new obstacles if threshold reached
    const spawnZ = -CONFIG.WORLD.SPAWN_Z_DISTANCE;
    while (this.nextObstacleZ > spawnZ) {
      this.spawnSolvableObstacleRow(this.nextObstacleZ, currentSpeed);
      // Spacing grows with speed so player always has guaranteed reaction time
      const spacing = Math.max(CONFIG.OBSTACLES.MIN_SPAWN_INTERVAL_METERS, currentSpeed * 0.95);
      this.nextObstacleZ -= spacing;
    }

    // 4. Spawn coin patterns
    while (this.nextCoinZ > spawnZ) {
      this.spawnCoinPattern(this.nextCoinZ);
      this.nextCoinZ -= 14.0 + Math.random() * 8.0;
    }
  }

  /**
   * Spawns an obstacle row with a mathematical guarantee of survivability.
   * Never blocks all 3 lanes with impassable obstacles.
   */
  public spawnSolvableObstacleRow(z: number, currentSpeed: number): void {
    // Difficulty factor from 0.0 to 1.0 based on current speed
    const speedRatio = Math.min(
      1.0,
      Math.max(0.0, (currentSpeed - CONFIG.SPEED.INITIAL) / (CONFIG.SPEED.MAX - CONFIG.SPEED.INITIAL))
    );

    const rand = Math.random();

    // Pattern 1 (Low speed or random): Single obstacle in one lane
    if (rand < 0.45 - speedRatio * 0.15) {
      const lane = this.randomLane();
      const type = this.randomObstacleType();
      this.obstaclePool.spawn(type, lane, z, this.scene);
      this.spawnEncouragingCoinsForObstacle(type, lane, z);
      return;
    }

    // Pattern 2: Two obstacles in two lanes (leaves at least one lane completely open)
    if (rand < 0.85) {
      const openLane = this.randomLane();
      const lanes: Lane[] = [LANE.LEFT, LANE.MIDDLE, LANE.RIGHT];
      const blockedLanes = lanes.filter((l) => l !== openLane);

      for (const lane of blockedLanes) {
        // Can be any type, but openLane is guaranteed 100% open
        const type = this.randomObstacleType();
        this.obstaclePool.spawn(type, lane, z, this.scene);
      }

      // Spawn coins along the open lane to guide the player!
      for (let i = -1; i <= 1; i++) {
        this.coinPool.spawn(openLane, CONFIG.COINS.GROUND_Y, z + i * CONFIG.COINS.LINE_SPACING, this.scene);
      }
      return;
    }

    // Pattern 3: All 3 lanes have obstacles, BUT at least one is LOW (jumpable) or OVERHEAD (slideable).
    // NEVER 3 FULL BLOCKS.
    const safeLane = this.randomLane();
    const safeType: ObstacleType = Math.random() < 0.5 ? OBSTACLE_TYPE.LOW : OBSTACLE_TYPE.OVERHEAD;

    for (let l = 0; l < 3; l++) {
      const lane = l as Lane;
      if (lane === safeLane) {
        this.obstaclePool.spawn(safeType, lane, z, this.scene);
        this.spawnEncouragingCoinsForObstacle(safeType, lane, z);
      } else {
        // Non-safe lanes can have full blockers or other obstacles
        const otherType = Math.random() < 0.6 ? OBSTACLE_TYPE.FULL_BLOCK : (safeType === OBSTACLE_TYPE.LOW ? OBSTACLE_TYPE.OVERHEAD : OBSTACLE_TYPE.LOW);
        this.obstaclePool.spawn(otherType, lane, z, this.scene);
      }
    }
  }

  /**
   * Spawns coins that guide and teach the player the correct action for an obstacle.
   * - Arc above LOW obstacle (encouraging jump)
   * - Low line beneath OVERHEAD obstacle (encouraging slide)
   */
  private spawnEncouragingCoinsForObstacle(type: ObstacleType, lane: Lane, z: number): void {
    if (type === OBSTACLE_TYPE.LOW) {
      // Jumping arc
      this.coinPool.spawn(lane, CONFIG.COINS.GROUND_Y, z + 2.5, this.scene);
      this.coinPool.spawn(lane, CONFIG.COINS.JUMP_ARC_Y, z, this.scene);
      this.coinPool.spawn(lane, CONFIG.COINS.GROUND_Y, z - 2.5, this.scene);
    } else if (type === OBSTACLE_TYPE.OVERHEAD) {
      // Sliding line
      this.coinPool.spawn(lane, CONFIG.COINS.SLIDE_Y, z + 2.5, this.scene);
      this.coinPool.spawn(lane, CONFIG.COINS.SLIDE_Y, z, this.scene);
      this.coinPool.spawn(lane, CONFIG.COINS.SLIDE_Y, z - 2.5, this.scene);
    }
  }

  /**
   * Spawns standalone coin trail patterns.
   */
  public spawnCoinPattern(z: number): void {
    const lane = this.randomLane();
    const count = 3 + Math.floor(Math.random() * 3); // 3 to 5 coins

    const patternType = Math.random();
    if (patternType < 0.7) {
      // Straight line
      for (let i = 0; i < count; i++) {
        this.coinPool.spawn(lane, CONFIG.COINS.GROUND_Y, z - i * CONFIG.COINS.LINE_SPACING, this.scene);
      }
    } else {
      // Lane transition diagonal (e.g. from lane to adjacent lane)
      const targetLane = (lane === LANE.LEFT ? LANE.MIDDLE : (lane === LANE.RIGHT ? LANE.MIDDLE : (Math.random() < 0.5 ? LANE.LEFT : LANE.RIGHT))) as Lane;
      this.coinPool.spawn(lane, CONFIG.COINS.GROUND_Y, z, this.scene);
      this.coinPool.spawn(targetLane, CONFIG.COINS.GROUND_Y, z - CONFIG.COINS.LINE_SPACING * 1.5, this.scene);
    }
  }

  private randomLane(): Lane {
    return Math.floor(Math.random() * 3) as Lane;
  }

  private randomObstacleType(): ObstacleType {
    const types: ObstacleType[] = [OBSTACLE_TYPE.LOW, OBSTACLE_TYPE.OVERHEAD, OBSTACLE_TYPE.FULL_BLOCK];
    return types[Math.floor(Math.random() * types.length)];
  }
}
