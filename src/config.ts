import { Lane, VisualZone, ZoneConfig } from './types';

/**
 * Central configuration module for Jungle Runner.
 * All gameplay tuning values, dimensions, timings, and speeds are centralized here.
 */
export const CONFIG = {
  // Lanes
  LANE_COUNT: 3,
  LANE_WIDTH: 2.4,
  LANE_X: [-2.4, 0, 2.4] as const,
  LANE_SWITCH_DURATION: 0.18, // seconds for smooth lane transition
  LANE_BOUNDARY_DEATH: true, // mandatory rule: out-of-lane triggers game over

  // Speed and Progression
  SPEED: {
    INITIAL: 14.0, // meters per second
    MAX: 28.0, // maximum capped running speed
    ACCELERATION: 0.15, // m/s^2 smooth linear acceleration
    MAX_DELTA_TIME: 0.1, // clamp delta time to prevent physics explosions on frame spikes
  },

  // Player Actions
  PLAYER: {
    WIDTH: 0.7,
    DEPTH: 0.7,
    STAND_HEIGHT: 1.8,
    SLIDE_HEIGHT: 0.65,
    SLIDE_DEPTH: 0.95,
    JUMP_DURATION: 0.72, // seconds
    JUMP_HEIGHT: 2.3, // peak meters
    SLIDE_DURATION: 0.65, // seconds
    RUN_CYCLE_SPEED: 11.0, // animation cycle multiplier
  },

  // Obstacle Dimensions
  OBSTACLES: {
    LOW: {
      WIDTH: 2.1,
      HEIGHT: 0.75, // Player jump peak is 2.3m, standing height is 1.8m
      DEPTH: 0.8,
      MIN_Y: 0,
      MAX_Y: 0.75,
    },
    OVERHEAD: {
      WIDTH: 2.1,
      HEIGHT: 1.7,
      DEPTH: 0.8,
      MIN_Y: 1.05, // Slide height is 0.65m; standing is 1.8m
      MAX_Y: 2.75,
    },
    FULL_BLOCK: {
      WIDTH: 2.1,
      HEIGHT: 2.9, // Blocks whole lane vertically and horizontally
      DEPTH: 0.9,
      MIN_Y: 0,
      MAX_Y: 2.9,
    },
    MIN_SPAWN_INTERVAL_METERS: 22.0, // minimum distance between obstacle rows
    INITIAL_SAFE_DISTANCE: 45.0, // starting clean runway with no obstacles
  },

  // Coins
  COINS: {
    RADIUS: 0.35,
    THICKNESS: 0.12,
    GROUND_Y: 0.8,
    JUMP_ARC_Y: 2.1,
    SLIDE_Y: 0.45,
    ROTATION_SPEED: 3.5, // rad/s
    LINE_SPACING: 2.5, // spacing between coins in a line
    POOL_SIZE: 60,
  },

  // World and Track Generation
  WORLD: {
    SECTION_LENGTH: 30.0,
    VISIBLE_SECTIONS: 6,
    DESPAWN_Z: 15.0, // behind the camera
    SPAWN_Z_DISTANCE: 180.0, // ahead of player
    TRACK_WIDTH: 8.6,
    ZONE_CYCLE_DISTANCE: 300.0, // distance per visual zone in meters
  },

  // Camera Settings
  CAMERA: {
    FOV: 60,
    NEAR: 0.1,
    FAR: 250,
    OFFSET_X: 0,
    OFFSET_Y: 3.8,
    OFFSET_Z: 6.2,
    LOOK_AT_Y: 1.4,
    LOOK_AT_Z: -10.0,
    SMOOTH_X_FACTOR: 8.0,
    SMOOTH_Y_FACTOR: 6.0,
  },

  // Visual Zones
  ZONES: {
    LUSH_JUNGLE: {
      name: 'LUSH_JUNGLE',
      displayName: 'Lush Jungle',
      fogColor: 0x1b3b22,
      fogDensity: 0.012,
      ambientColor: 0x487042,
      ambientIntensity: 1.2,
      sunColor: 0xfff4d0,
      sunIntensity: 1.8,
      trackColor: 0x3d352a,
      curbColor: 0x225528,
    } as ZoneConfig,
    TEMPLE_RUINS: {
      name: 'TEMPLE_RUINS',
      displayName: 'Temple Ruins',
      fogColor: 0x3d2c1d,
      fogDensity: 0.013,
      ambientColor: 0x7a6348,
      ambientIntensity: 1.1,
      sunColor: 0xffd294,
      sunIntensity: 1.9,
      trackColor: 0x5a5043,
      curbColor: 0x8c7355,
    } as ZoneConfig,
    STONE_PASSAGES: {
      name: 'STONE_PASSAGES',
      displayName: 'Stone Passages',
      fogColor: 0x141f24,
      fogDensity: 0.015,
      ambientColor: 0x33444d,
      ambientIntensity: 0.95,
      sunColor: 0xa8c8dc,
      sunIntensity: 1.4,
      trackColor: 0x252b30,
      curbColor: 0x384a54,
    } as ZoneConfig,
  },

  // Persistence
  STORAGE: {
    BEST_DISTANCE_KEY: 'jungle_runner_best_distance',
  },
} as const;

export function getLaneX(lane: Lane): number {
  return CONFIG.LANE_X[lane];
}

export function getZoneForDistance(distance: number): VisualZone {
  const cycle = Math.floor(distance / CONFIG.WORLD.ZONE_CYCLE_DISTANCE) % 3;
  if (cycle === 0) return 'LUSH_JUNGLE';
  if (cycle === 1) return 'TEMPLE_RUINS';
  return 'STONE_PASSAGES';
}
