import { describe, it, expect } from 'vitest';
import { World, WORLD_SIZE, BLOCK_TYPES, generateIsland } from '../src/logic/world.js';

describe('STEP 0: 世界資料與空島生成 (world.js)', () => {
  it('世界大小固定在 32x32x32 格以內', () => {
    const world = new World();
    expect(WORLD_SIZE).toBeLessThanOrEqual(32);
    expect(world.width).toBeGreaterThan(0);
    expect(world.height).toBeGreaterThan(0);
    expect(world.depth).toBeGreaterThan(0);
    expect(world.width).toBeLessThanOrEqual(32);
    expect(world.height).toBeLessThanOrEqual(32);
    expect(world.depth).toBeLessThanOrEqual(32);
  });

  it('座標邊界檢查：範圍內回傳 true，超出範圍回傳 false 且安全處理讀寫', () => {
    const world = new World();
    expect(world.isInBounds(0, 0, 0)).toBe(true);
    expect(world.isInBounds(31, 31, 31)).toBe(true);

    expect(world.isInBounds(-1, 10, 10)).toBe(false);
    expect(world.isInBounds(10, -1, 10)).toBe(false);
    expect(world.isInBounds(10, 10, -1)).toBe(false);
    expect(world.isInBounds(32, 10, 10)).toBe(false);
    expect(world.isInBounds(10, 32, 10)).toBe(false);
    expect(world.isInBounds(10, 10, 32)).toBe(false);

    expect(world.getBlock(-1, 5, 5)).toBe(BLOCK_TYPES.AIR);
    expect(world.getBlock(32, 5, 5)).toBe(BLOCK_TYPES.AIR);
    expect(world.setBlock(-1, 5, 5, BLOCK_TYPES.STONE)).toBe(false);
    expect(world.setBlock(32, 5, 5, BLOCK_TYPES.STONE)).toBe(false);
  });

  it('方塊讀寫：可設定、讀取與移除方塊，並正確判斷是否為實體方塊', () => {
    const world = new World();
    expect(world.getBlock(10, 12, 14)).toBe(BLOCK_TYPES.AIR);
    expect(world.isSolid(10, 12, 14)).toBe(false);

    expect(world.setBlock(10, 12, 14, BLOCK_TYPES.STONE)).toBe(true);
    expect(world.getBlock(10, 12, 14)).toBe(BLOCK_TYPES.STONE);
    expect(world.isSolid(10, 12, 14)).toBe(true);

    expect(world.setBlock(10, 12, 14, BLOCK_TYPES.SAND)).toBe(true);
    expect(world.getBlock(10, 12, 14)).toBe(BLOCK_TYPES.SAND);

    expect(world.setBlock(10, 12, 14, BLOCK_TYPES.AIR)).toBe(true);
    expect(world.getBlock(10, 12, 14)).toBe(BLOCK_TYPES.AIR);
    expect(world.isSolid(10, 12, 14)).toBe(false);
  });

  it('空島生成：懸浮於空中，包含草地、泥土、石頭、沙子，（建築由 building.test.js 測）', () => {
    const world = new World();
    generateIsland(world);

    const counts = {
      [BLOCK_TYPES.GRASS]: 0,
      [BLOCK_TYPES.DIRT]: 0,
      [BLOCK_TYPES.STONE]: 0,
      [BLOCK_TYPES.SAND]: 0,
      [BLOCK_TYPES.BRICK]: 0,
      [BLOCK_TYPES.PLANKS]: 0,
    };

    let bottomLayerSolidCount = 0;
    let topLayerSolidCount = 0;

    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        for (let z = 0; z < world.depth; z++) {
          const block = world.getBlock(x, y, z);
          if (block in counts) {
            counts[block]++;
          }
          if (y === 0 && block !== BLOCK_TYPES.AIR) {
            bottomLayerSolidCount++;
          }
          if (y === world.height - 1 && block !== BLOCK_TYPES.AIR) {
            topLayerSolidCount++;
          }
        }
      }
    }

    expect(counts[BLOCK_TYPES.GRASS]).toBeGreaterThan(0);
    expect(counts[BLOCK_TYPES.DIRT]).toBeGreaterThan(0);
    expect(counts[BLOCK_TYPES.STONE]).toBeGreaterThan(0);
    expect(counts[BLOCK_TYPES.SAND]).toBeGreaterThan(0);

    expect(bottomLayerSolidCount).toBe(0);
    expect(topLayerSolidCount).toBe(0);
  });
});
