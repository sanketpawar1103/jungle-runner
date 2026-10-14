import { CONFIG } from '../config';

/**
 * Robust wrapper for localStorage persistence of player's best distance.
 * Handles storage errors (e.g. disabled cookies, incognito mode, quota exceeded) safely.
 */
export class StorageManager {
  private key: string;
  private memoryFallback: number = 0;

  constructor(key: string = CONFIG.STORAGE.BEST_DISTANCE_KEY) {
    this.key = key;
  }

  /**
   * Retrieves the stored best distance in meters.
   * Returns 0 if no record exists or storage is inaccessible.
   */
  public getBestDistance(): number {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return this.memoryFallback;
      }
      const raw = window.localStorage.getItem(this.key);
      if (!raw) {
        return this.memoryFallback;
      }
      const parsed = parseFloat(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
      return this.memoryFallback;
    } catch (e) {
      console.warn('StorageManager: Failed to read best distance from localStorage, using memory fallback', e);
      return this.memoryFallback;
    }
  }

  /**
   * Updates the best distance if the provided distance exceeds the current record.
   * Returns the new or existing best distance.
   */
  public updateBestDistance(distance: number): number {
    if (!Number.isFinite(distance) || distance < 0) {
      return this.getBestDistance();
    }

    const currentBest = this.getBestDistance();
    if (distance > currentBest) {
      const rounded = Math.floor(distance);
      this.memoryFallback = rounded;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(this.key, rounded.toString());
        }
      } catch (e) {
        console.warn('StorageManager: Failed to write best distance to localStorage', e);
      }
      return rounded;
    }
    return currentBest;
  }

  /**
   * Clears the stored record (useful for testing or resetting).
   */
  public clear(): void {
    this.memoryFallback = 0;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.key);
      }
    } catch (e) {
      console.warn('StorageManager: Failed to clear localStorage', e);
    }
  }
}

export const storageManager = new StorageManager();
