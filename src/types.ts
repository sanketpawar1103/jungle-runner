/**
 * Core type definitions for Jungle Runner.
 */

export type GameState = 'LOADING' | 'MENU' | 'RUNNING' | 'PAUSED' | 'GAME_OVER' | 'ERROR';

export type Lane = 0 | 1 | 2;

export const LANE = {
  LEFT: 0 as Lane,
  MIDDLE: 1 as Lane,
  RIGHT: 2 as Lane,
} as const;

export type VerticalAction = 'NONE' | 'JUMPING' | 'SLIDING';

export type ObstacleType = 'LOW' | 'OVERHEAD' | 'FULL_BLOCK';

export const OBSTACLE_TYPE = {
  LOW: 'LOW' as ObstacleType,
  OVERHEAD: 'OVERHEAD' as ObstacleType,
  FULL_BLOCK: 'FULL_BLOCK' as ObstacleType,
} as const;

export type VisualZone = 'LUSH_JUNGLE' | 'TEMPLE_RUINS' | 'STONE_PASSAGES';

export interface BoundingBox3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface PlayerCollisionState {
  lane: Lane;
  x: number;
  y: number;
  z: number;
  action: VerticalAction;
  bounds: BoundingBox3D;
}

export interface ObstacleInstance {
  id: number;
  type: ObstacleType;
  lane: Lane;
  z: number;
  active: boolean;
  bounds: BoundingBox3D;
}

export interface CoinInstance {
  id: number;
  lane: Lane;
  x: number;
  y: number;
  z: number;
  collected: boolean;
  active: boolean;
  bounds: BoundingBox3D;
}

export interface ZoneConfig {
  name: VisualZone;
  displayName: string;
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  trackColor: number;
  curbColor: number;
}

export interface GameScoreState {
  distance: number;
  coins: number;
  bestDistance: number;
}
