import { describe, it, expect } from 'vitest';
import { collisionSystem } from '../src/game/collision';
import { ObstacleObject } from '../src/game/obstacles';
import { CoinObject } from '../src/game/coins';
import { Player } from '../src/game/player';
import { LANE, OBSTACLE_TYPE } from '../src/types';
import { CONFIG } from '../src/config';

describe('Collision Detection and Mechanics', () => {
  it('LOW OBSTACLE: should hit when standing or sliding, and clear when jumping', () => {
    const lowObs = new ObstacleObject(OBSTACLE_TYPE.LOW);
    lowObs.activate(LANE.MIDDLE, 0); // at z = 0, middle lane

    const player = new Player({ onGameOver: () => {} });
    player.reset(); // at z = 0, middle lane

    // 1. Standing -> Collision!
    let col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, lowObs.getInstance())).toBe(true);

    // 2. Sliding -> Collision!
    player.handleSlide();
    player.update(CONFIG.PLAYER.SLIDE_DURATION / 2, 14);
    col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, lowObs.getInstance())).toBe(true);

    // 3. Jumping with sufficient clearance -> Clears cleanly!
    player.handleJump();
    player.update(CONFIG.PLAYER.JUMP_DURATION / 2, 14); // peak of jump
    col = player.getCollisionState();
    expect(col.bounds.minY).toBeGreaterThan(CONFIG.OBSTACLES.LOW.MAX_Y);
    expect(collisionSystem.checkPlayerObstacle(col, lowObs.getInstance())).toBe(false);
  });

  it('OVERHEAD OBSTACLE: should hit when standing or jumping, and clear when sliding', () => {
    const overheadObs = new ObstacleObject(OBSTACLE_TYPE.OVERHEAD);
    overheadObs.activate(LANE.MIDDLE, 0);

    const player = new Player({ onGameOver: () => {} });
    player.reset();

    // 1. Standing -> Collision!
    let col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, overheadObs.getInstance())).toBe(true);

    // 2. Jumping -> Collision!
    player.handleJump();
    player.update(CONFIG.PLAYER.JUMP_DURATION / 2, 14);
    col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, overheadObs.getInstance())).toBe(true);

    // 3. Sliding -> Clears cleanly underneath!
    player.handleSlide();
    player.update(CONFIG.PLAYER.SLIDE_DURATION / 2, 14);
    col = player.getCollisionState();
    expect(col.bounds.maxY).toBeLessThan(CONFIG.OBSTACLES.OVERHEAD.MIN_Y);
    expect(collisionSystem.checkPlayerObstacle(col, overheadObs.getInstance())).toBe(false);
  });

  it('FULL-LANE BLOCKER: must block standing, jumping, and sliding; only changing lane clears it', () => {
    const blocker = new ObstacleObject(OBSTACLE_TYPE.FULL_BLOCK);
    blocker.activate(LANE.MIDDLE, 0);

    const player = new Player({ onGameOver: () => {} });
    player.reset();

    // Standing
    let col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, blocker.getInstance())).toBe(true);

    // Jumping
    player.handleJump();
    player.update(CONFIG.PLAYER.JUMP_DURATION / 2, 14);
    col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, blocker.getInstance())).toBe(true);

    // Sliding
    player.handleSlide();
    player.update(CONFIG.PLAYER.SLIDE_DURATION / 2, 14);
    col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, blocker.getInstance())).toBe(true);

    // Changing lane to Left lane -> Clears safely!
    player.reset();
    player.handleLeft();
    for (let i = 0; i < 15; i++) player.update(0.02, 14); // finish switch
    col = player.getCollisionState();
    expect(collisionSystem.checkPlayerObstacle(col, blocker.getInstance())).toBe(false);
  });

  it('COIN: collects active coin exactly once and ignores deactivated/collected coin', () => {
    const coin = new CoinObject();
    coin.activate(LANE.MIDDLE, CONFIG.COINS.GROUND_Y, 0);

    const player = new Player({ onGameOver: () => {} });
    player.reset();
    const col = player.getCollisionState();

    // First check -> intersects and collects
    expect(collisionSystem.checkPlayerCoin(col, coin.getInstance())).toBe(true);

    // Mark collected
    coin.markCollected();
    expect(coin.collected).toBe(true);

    // Second check -> already collected, returns false!
    expect(collisionSystem.checkPlayerCoin(col, coin.getInstance())).toBe(false);
  });
});
