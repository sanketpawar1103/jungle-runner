import { BoundingBox3D, PlayerCollisionState, ObstacleInstance, CoinInstance } from '../types';

/**
 * Checks if two 3D Axis-Aligned Bounding Boxes (AABB) intersect.
 */
export function testAABBOverlap(a: BoundingBox3D, b: BoundingBox3D): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY &&
    a.minZ <= b.maxZ &&
    a.maxZ >= b.minZ
  );
}

/**
 * Collision Detector for Jungle Runner.
 * Accurately determines collisions between the player, obstacles, and collectible coins.
 */
export class CollisionSystem {
  /**
   * Tests player against an obstacle.
   * Returns true if there is an active collision.
   */
  public checkPlayerObstacle(player: PlayerCollisionState, obstacle: ObstacleInstance): boolean {
    if (!obstacle.active) {
      return false;
    }
    return testAABBOverlap(player.bounds, obstacle.bounds);
  }

  /**
   * Tests player against a coin.
   * Returns true if player intersects the uncollected coin.
   */
  public checkPlayerCoin(player: PlayerCollisionState, coin: CoinInstance): boolean {
    if (!coin.active || coin.collected) {
      return false;
    }
    return testAABBOverlap(player.bounds, coin.bounds);
  }
}

export const collisionSystem = new CollisionSystem();
