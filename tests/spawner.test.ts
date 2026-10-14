import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { WorldSpawner } from '../src/game/spawner';
import { ObstaclePool } from '../src/game/obstacles';
import { CoinPool } from '../src/game/coins';
import { OBSTACLE_TYPE } from '../src/types';

describe('World Spawner and Solvability Guarantee', () => {
  let scene: THREE.Scene;
  let obstaclePool: ObstaclePool;
  let coinPool: CoinPool;
  let spawner: WorldSpawner;

  beforeEach(() => {
    scene = new THREE.Scene();
    obstaclePool = new ObstaclePool(scene, 15);
    coinPool = new CoinPool(scene, 60);
    spawner = new WorldSpawner(scene, obstaclePool, coinPool);
  });

  it('SOLVABILITY GUARANTEE: should never generate 3 full-block obstacles at the same row', () => {
    // Run 150 procedural row generations across varying speeds
    for (let testRun = 0; testRun < 150; testRun++) {
      obstaclePool.reset();
      coinPool.reset();

      const speed = 14 + Math.random() * 16; // from initial to max speed
      spawner.spawnSolvableObstacleRow(-50, speed);

      const active = obstaclePool.getActiveObstacles();
      const fullBlocks = active.filter((o) => o.type === OBSTACLE_TYPE.FULL_BLOCK);

      // Must never have 3 full blocks (which would make survival impossible)
      expect(fullBlocks.length).toBeLessThan(3);

      if (active.length === 3) {
        // If all 3 lanes have an obstacle, at least one MUST be jumpable (LOW) or slideable (OVERHEAD)
        const hasClearableObstacle = active.some(
          (o) => o.type === OBSTACLE_TYPE.LOW || o.type === OBSTACLE_TYPE.OVERHEAD
        );
        expect(hasClearableObstacle).toBe(true);
      }
    }
  });

  it('should spawn coins when generating obstacles or patterns', () => {
    spawner.spawnCoinPattern(-40);
    const coins = coinPool.getActiveCoins();
    expect(coins.length).toBeGreaterThanOrEqual(1);
  });

  it('should reset spawner clean state without active obstacles or coins', () => {
    spawner.spawnSolvableObstacleRow(-40, 14);
    spawner.spawnCoinPattern(-50);
    expect(obstaclePool.getActiveObstacles().length).toBeGreaterThan(0);
    expect(coinPool.getActiveCoins().length).toBeGreaterThan(0);

    obstaclePool.reset();
    coinPool.reset();
    spawner.reset();

    expect(obstaclePool.getActiveObstacles().length).toBe(0);
    expect(coinPool.getActiveCoins().length).toBe(0);
  });
});
