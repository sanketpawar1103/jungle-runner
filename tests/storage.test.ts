import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from '../src/utils/storage';

describe('StorageManager Persistence', () => {
  let storage: StorageManager;
  const TEST_KEY = 'test_jungle_best_distance';

  beforeEach(() => {
    localStorage.clear();
    storage = new StorageManager(TEST_KEY);
  });

  it('should return 0 when no record is stored', () => {
    expect(storage.getBestDistance()).toBe(0);
  });

  it('should update and store a new best distance', () => {
    const updated = storage.updateBestDistance(150.8);
    expect(updated).toBe(150);
    expect(storage.getBestDistance()).toBe(150);
    expect(localStorage.getItem(TEST_KEY)).toBe('150');
  });

  it('should not overwrite an existing higher record with a lower score', () => {
    storage.updateBestDistance(200);
    const result = storage.updateBestDistance(120);
    expect(result).toBe(200);
    expect(storage.getBestDistance()).toBe(200);
  });

  it('should handle invalid or corrupted stored values gracefully', () => {
    localStorage.setItem(TEST_KEY, 'invalid_non_numeric_string');
    expect(storage.getBestDistance()).toBe(0);

    localStorage.setItem(TEST_KEY, '-50');
    expect(storage.getBestDistance()).toBe(0);
  });

  it('should clear stored value', () => {
    storage.updateBestDistance(300);
    expect(storage.getBestDistance()).toBe(300);
    storage.clear();
    expect(storage.getBestDistance()).toBe(0);
    expect(localStorage.getItem(TEST_KEY)).toBeNull();
  });
});
