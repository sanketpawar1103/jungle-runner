import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player } from '../src/game/player';
import { LANE } from '../src/types';
import { CONFIG } from '../src/config';

describe('Player Movement and Rules', () => {
  let player: Player;
  let gameOverMock = vi.fn((_reason: string) => {});
  let laneSwitchMock = vi.fn(() => {});
  let jumpMock = vi.fn(() => {});
  let slideMock = vi.fn(() => {});

  beforeEach(() => {
    gameOverMock = vi.fn((_reason: string) => {});
    laneSwitchMock = vi.fn(() => {});
    jumpMock = vi.fn(() => {});
    slideMock = vi.fn(() => {});

    player = new Player({
      onGameOver: gameOverMock,
      onLaneSwitch: laneSwitchMock,
      onJump: jumpMock,
      onSlide: slideMock,
    });
  });

  it('should initialize at middle lane with zero elevation and running state', () => {
    expect(player.lane).toBe(LANE.MIDDLE);
    expect(player.targetLane).toBe(LANE.MIDDLE);
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
    expect(player.action).toBe('NONE');
    expect(player.isAlive).toBe(true);
  });

  describe('Lane switching and boundary rules', () => {
    it('should switch one lane to the left from middle lane', () => {
      player.handleLeft();
      expect(player.targetLane).toBe(LANE.LEFT);
      expect(laneSwitchMock).toHaveBeenCalledOnce();
      expect(gameOverMock).not.toHaveBeenCalled();
    });

    it('should switch one lane to the right from middle lane', () => {
      player.handleRight();
      expect(player.targetLane).toBe(LANE.RIGHT);
      expect(laneSwitchMock).toHaveBeenCalledOnce();
      expect(gameOverMock).not.toHaveBeenCalled();
    });

    it('MANDATORY RULE: pressing Left while in leftmost lane must trigger immediate game over', () => {
      player.handleLeft(); // middle -> left
      expect(player.targetLane).toBe(LANE.LEFT);

      // Now at leftmost lane, press Left again
      player.handleLeft();
      expect(player.isAlive).toBe(false);
      expect(gameOverMock).toHaveBeenCalledOnce();
      expect(gameOverMock).toHaveBeenCalledWith(expect.stringContaining('left side'));
    });

    it('MANDATORY RULE: pressing Right while in rightmost lane must trigger immediate game over', () => {
      player.handleRight(); // middle -> right
      expect(player.targetLane).toBe(LANE.RIGHT);

      // Now at rightmost lane, press Right again
      player.handleRight();
      expect(player.isAlive).toBe(false);
      expect(gameOverMock).toHaveBeenCalledOnce();
      expect(gameOverMock).toHaveBeenCalledWith(expect.stringContaining('right side'));
    });

    it('should smoothly interpolate x towards target lane', () => {
      player.handleRight();
      expect(player.x).toBe(0);

      // Advance by half duration
      player.update(0.1, 14);
      expect(player.x).toBeGreaterThan(0);
      expect(player.x).toBeLessThan(CONFIG.LANE_X[2]);

      // Complete transition
      for (let i = 0; i < 10; i++) {
        player.update(0.05, 14);
      }
      expect(player.lane).toBe(LANE.RIGHT);
      expect(Math.abs(player.x - CONFIG.LANE_X[2])).toBeLessThan(0.05);
    });
  });

  describe('Vertical Actions and Cancellation Rules', () => {
    it('should start jump on Up arrow and elevate y over time', () => {
      player.handleJump();
      expect(player.action).toBe('JUMPING');
      expect(jumpMock).toHaveBeenCalledOnce();

      // Middle of jump arc (half duration)
      player.update(CONFIG.PLAYER.JUMP_DURATION / 2, 14);
      expect(player.y).toBeCloseTo(CONFIG.PLAYER.JUMP_HEIGHT, 0.1);

      // Complete jump
      player.update(CONFIG.PLAYER.JUMP_DURATION / 2 + 0.05, 14);
      expect(player.action).toBe('NONE');
      expect(player.y).toBe(0);
    });

    it('should start slide on Down arrow and return to normal after duration', () => {
      player.handleSlide();
      expect(player.action).toBe('SLIDING');
      expect(slideMock).toHaveBeenCalledOnce();

      player.update(CONFIG.PLAYER.SLIDE_DURATION / 2, 14);
      expect(player.action).toBe('SLIDING');
      const col = player.getCollisionState();
      expect(col.bounds.maxY).toBe(CONFIG.PLAYER.SLIDE_HEIGHT);

      // Complete slide
      player.update(CONFIG.PLAYER.SLIDE_DURATION / 2 + 0.05, 14);
      expect(player.action).toBe('NONE');
    });

    it('CANCELLATION: Up during slide cancels slide and immediately starts jump', () => {
      player.handleSlide();
      expect(player.action).toBe('SLIDING');

      player.update(0.2, 14);
      expect(player.action).toBe('SLIDING');

      // Player presses Up while sliding
      player.handleJump();
      expect(player.action).toBe('JUMPING');
      expect(jumpMock).toHaveBeenCalledOnce();

      // Update into jump
      player.update(CONFIG.PLAYER.JUMP_DURATION / 2, 14);
      expect(player.y).toBeGreaterThan(1.5);
    });

    it('CANCELLATION: Down during jump cancels jump and immediately starts slide', () => {
      player.handleJump();
      expect(player.action).toBe('JUMPING');

      player.update(0.2, 14);
      expect(player.y).toBeGreaterThan(1.0);

      // Player presses Down while jumping
      player.handleSlide();
      expect(player.action).toBe('SLIDING');
      expect(slideMock).toHaveBeenCalledOnce();

      // Collision height is immediately reduced to slide height
      const col = player.getCollisionState();
      expect(col.bounds.maxY).toBe(CONFIG.PLAYER.SLIDE_HEIGHT);
    });

    it('should allow lane switching while jumping or sliding', () => {
      // Jump and lane switch
      player.handleJump();
      player.handleLeft();
      expect(player.action).toBe('JUMPING');
      expect(player.targetLane).toBe(LANE.LEFT);

      // Slide and lane switch
      player.handleSlide();
      player.handleRight();
      expect(player.action).toBe('SLIDING');
      expect(player.targetLane).toBe(LANE.MIDDLE);
    });
  });

  describe('Reset', () => {
    it('should completely restore all state on reset', () => {
      player.handleJump();
      player.handleRight();
      player.update(0.3, 14);
      player.kill('test');
      expect(player.isAlive).toBe(false);

      player.reset();
      expect(player.isAlive).toBe(true);
      expect(player.lane).toBe(LANE.MIDDLE);
      expect(player.targetLane).toBe(LANE.MIDDLE);
      expect(player.x).toBe(0);
      expect(player.y).toBe(0);
      expect(player.action).toBe('NONE');
    });
  });
});
