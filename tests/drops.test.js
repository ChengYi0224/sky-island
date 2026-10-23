import { describe, it, expect, beforeEach } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { DropManager, DropEntity } from '../src/logic/drops.js';

describe('STEP 2: 掉落物邏輯 (drops.js)', () => {
  let world;
  let dropManager;

  beforeEach(() => {
    world = new World();
    dropManager = new DropManager(world);
  });

  it('方塊不見生成同種類的小方塊 entity，且帶有向上彈跳初速 (彈出)', () => {
    const drop = dropManager.spawn(10, 10, 10, BLOCK_TYPES.STONE);

    expect(drop).toBeDefined();
    expect(drop.type).toBe(BLOCK_TYPES.STONE);
    expect(dropManager.drops).toContain(drop);

    // 生成位置應位於方塊座標範圍內
    expect(drop.x).toBeGreaterThanOrEqual(10);
    expect(drop.x).toBeLessThanOrEqual(11);
    expect(drop.y).toBeGreaterThanOrEqual(10);
    expect(drop.y).toBeLessThanOrEqual(11);
    expect(drop.z).toBeGreaterThanOrEqual(10);
    expect(drop.z).toBeLessThanOrEqual(11);

    // 彈出：具有大於 0 的初始向上速度
    expect(drop.vy).toBeGreaterThan(0);
  });

  it('隨時間更新 (dt) 掉落物小方塊持續旋轉 (慢慢轉)', () => {
    const drop = dropManager.spawn(10, 10, 10, BLOCK_TYPES.DIRT);
    const initialRotation = drop.rotation;

    dropManager.update(0.1);
    expect(drop.rotation).toBeGreaterThan(initialRotation);

    const nextRotation = drop.rotation;
    dropManager.update(0.2);
    expect(drop.rotation).toBeGreaterThan(nextRotation);
  });

  it('不可以浮在空中：懸空的掉落物受重力往下掉落', () => {
    // 在半空中生成掉落物，下方全為空氣
    const drop = dropManager.spawn(10, 20, 10, BLOCK_TYPES.SAND);
    const initialY = drop.y;

    // 模擬物理經過 1 秒（dt = 0.05）
    for (let i = 0; i < 20; i++) {
      dropManager.update(0.05);
    }

    // 掉落物受重力加速，速度向下且高度明顯低於初始高度，不浮在空中
    expect(drop.vy).toBeLessThan(0);
    expect(drop.y).toBeLessThan(initialY);
    expect(drop.onGround).toBe(false);
  });

  it('不可以穿過地面：掉落物碰到下方實體方塊頂面時停住', () => {
    // 於 y=5 設置實體地面方塊（頂面高度為 6）
    world.setBlock(10, 5, 10, BLOCK_TYPES.DIRT);

    // 在 y=8 生成掉落物
    const drop = dropManager.spawn(10, 8, 10, BLOCK_TYPES.DIRT);

    // 模擬 2 秒，掉落物下落至 y=5 方塊頂面
    for (let i = 0; i < 40; i++) {
      dropManager.update(0.05);
    }

    // 落地停在頂面上，不再向下穿越
    expect(drop.onGround).toBe(true);
    expect(drop.vy).toBe(0);
    expect(drop.y).toBeGreaterThanOrEqual(6.0);
    expect(drop.y).toBeLessThan(7.0);

    const landedY = drop.y;

    // 繼續更新時間，高度應保持穩定，不穿透地面
    dropManager.update(0.5);
    dropManager.update(0.5);
    expect(drop.y).toBeCloseTo(landedY, 3);
    expect(drop.onGround).toBe(true);
  });

  it('若下方的支撐方塊被挖掉，小方塊會再次受重力繼續往下掉，直到落到新的實體方塊頂面', () => {
    // 上層地面：y=10（頂面為 11），下層地面：y=4（頂面為 5）
    world.setBlock(10, 10, 10, BLOCK_TYPES.GRASS);
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);

    const drop = dropManager.spawn(10, 11, 10, BLOCK_TYPES.GRASS);

    // 掉落並穩定停在上層地面 y=10 頂部（y >= 11）
    for (let i = 0; i < 20; i++) {
      dropManager.update(0.05);
    }
    expect(drop.onGround).toBe(true);
    expect(drop.y).toBeGreaterThanOrEqual(11.0);

    // 挖掉下方的支撐方塊（設為空氣）
    world.setBlock(10, 10, 10, BLOCK_TYPES.AIR);

    // 再次更新時應偵測到失去支撐，重啟下落
    dropManager.update(0.05);
    expect(drop.onGround).toBe(false);

    // 模擬下落直到落在新的地面 y=4 頂部（頂面為 5）
    for (let i = 0; i < 40; i++) {
      dropManager.update(0.05);
    }
    expect(drop.onGround).toBe(true);
    expect(drop.vy).toBe(0);
    expect(drop.y).toBeGreaterThanOrEqual(5.0);
    expect(drop.y).toBeLessThan(6.0);
  });

  it('支援同時管理多個不同種類與位置的掉落物', () => {
    world.setBlock(5, 5, 5, BLOCK_TYPES.STONE);
    world.setBlock(8, 5, 8, BLOCK_TYPES.SAND);

    const drop1 = dropManager.spawn(5, 7, 5, BLOCK_TYPES.STONE);
    const drop2 = dropManager.spawn(8, 7, 8, BLOCK_TYPES.SAND);

    expect(dropManager.drops.length).toBe(2);

    dropManager.update(0.1);

    expect(drop1.rotation).toBeGreaterThan(0);
    expect(drop2.rotation).toBeGreaterThan(0);
    expect(drop1.type).toBe(BLOCK_TYPES.STONE);
    expect(drop2.type).toBe(BLOCK_TYPES.SAND);
  });
});
