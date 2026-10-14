import { describe, it, expect } from 'vitest';
import { CONFIG, getLaneX, getZoneForDistance } from '../src/config';

describe('Config and Zone Calculations', () => {
  it('should have 3 lanes configured with symmetrical positions', () => {
    expect(CONFIG.LANE_COUNT).toBe(3);
    expect(CONFIG.LANE_X.length).toBe(3);
    expect(CONFIG.LANE_X[0]).toBe(-CONFIG.LANE_X[2]);
    expect(CONFIG.LANE_X[1]).toBe(0);
    expect(getLaneX(0)).toBe(CONFIG.LANE_X[0]);
    expect(getLaneX(1)).toBe(0);
    expect(getLaneX(2)).toBe(CONFIG.LANE_X[2]);
  });

  it('should enforce speed progression limits', () => {
    expect(CONFIG.SPEED.INITIAL).toBeGreaterThan(0);
    expect(CONFIG.SPEED.MAX).toBeGreaterThan(CONFIG.SPEED.INITIAL);
    expect(CONFIG.SPEED.ACCELERATION).toBeGreaterThan(0);
    expect(CONFIG.SPEED.MAX_DELTA_TIME).toBeLessThanOrEqual(0.1);
  });

  it('should cycle through the 3 visual zones correctly based on distance', () => {
    expect(getZoneForDistance(0)).toBe('LUSH_JUNGLE');
    expect(getZoneForDistance(150)).toBe('LUSH_JUNGLE');
    expect(getZoneForDistance(305)).toBe('TEMPLE_RUINS');
    expect(getZoneForDistance(590)).toBe('TEMPLE_RUINS');
    expect(getZoneForDistance(610)).toBe('STONE_PASSAGES');
    expect(getZoneForDistance(890)).toBe('STONE_PASSAGES');
    expect(getZoneForDistance(920)).toBe('LUSH_JUNGLE'); // cyclic loop
  });

  it('should define obstacle dimensions that correspond with player height/jump', () => {
    // Jump peak must clear low obstacle
    expect(CONFIG.PLAYER.JUMP_HEIGHT).toBeGreaterThan(CONFIG.OBSTACLES.LOW.MAX_Y);

    // Slide height must fit below overhead obstacle
    expect(CONFIG.PLAYER.SLIDE_HEIGHT).toBeLessThan(CONFIG.OBSTACLES.OVERHEAD.MIN_Y);
    expect(CONFIG.PLAYER.STAND_HEIGHT).toBeGreaterThan(CONFIG.OBSTACLES.OVERHEAD.MIN_Y);

    // Full blocker must block standing and jumping
    expect(CONFIG.OBSTACLES.FULL_BLOCK.MAX_Y).toBeGreaterThan(CONFIG.PLAYER.STAND_HEIGHT);
    expect(CONFIG.OBSTACLES.FULL_BLOCK.MAX_Y).toBeGreaterThan(CONFIG.PLAYER.JUMP_HEIGHT);
  });
});
