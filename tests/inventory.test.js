import { describe, it, expect, beforeEach } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { Player } from '../src/logic/player.js';
import { DropManager } from '../src/logic/drops.js';
import { Inventory, PICKUP_DISTANCE } from '../src/logic/inventory.js';

describe('STEP 3: 快捷欄與背包資料結構 (inventory.js)', () => {
  it('建立快捷欄資料結構，預設有固定格數且初始數量為 0', () => {
    const inventory = new Inventory(9);

    expect(inventory.slots).toBeDefined();
    expect(inventory.slots.length).toBe(9);
    expect(inventory.slots.every((slot) => slot.count === 0)).toBe(true);
  });

  it('快捷欄加入物品時，同種類堆疊累積數量', () => {
    const inventory = new Inventory(9);

    inventory.addItem(BLOCK_TYPES.DIRT, 1);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);

    inventory.addItem(BLOCK_TYPES.DIRT, 2);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(3);
  });

  it('畫面上看得到快捷欄：不同種類方塊（泥土、石頭、沙子）加入時分別加進對應種類格子數字', () => {
    const inventory = new Inventory(9);

    inventory.addItem(BLOCK_TYPES.DIRT, 1);
    inventory.addItem(BLOCK_TYPES.STONE, 3);
    inventory.addItem(BLOCK_TYPES.SAND, 5);

    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);
    expect(inventory.getItemCount(BLOCK_TYPES.STONE)).toBe(3);
    expect(inventory.getItemCount(BLOCK_TYPES.SAND)).toBe(5);
  });
});

describe('STEP 3: 掉落物撿取邏輯與 3 格距離判定 (drops.js + inventory.js)', () => {
  let world;
  let player;
  let dropManager;
  let inventory;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 10.0, z: 10.5 });
    dropManager = new DropManager(world);
    inventory = new Inventory(9);
  });

  it('走到旁邊：距離 3 格以內（2.9 格）掉落物飛到身上被撿起，那一格數字 +1 且掉落物從小島移除', () => {
    // 掉落物座標與玩家距離為 2.9 格 (< 3 格)
    const drop = dropManager.spawn(10.5 + 2.9, 10.0, 10.5, BLOCK_TYPES.DIRT);

    expect(dropManager.drops).toContain(drop);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(0);

    dropManager.update(0.05, player, inventory);

    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);
    expect(dropManager.drops).not.toContain(drop);
  });

  it('不可以：站在 3 格外（3.1 格）也被撿起來', () => {
    // 掉落物座標與玩家距離為 3.1 格 (> 3 格)
    const drop = dropManager.spawn(10.5 + 3.1, 10.0, 10.5, BLOCK_TYPES.STONE);

    expect(dropManager.drops).toContain(drop);

    dropManager.update(0.05, player, inventory);

    expect(inventory.getItemCount(BLOCK_TYPES.STONE)).toBe(0);
    expect(dropManager.drops).toContain(drop);
  });

  it('邊界精確測試：距離 3.0 格內可撿取，超過 3.0 格不可撿取', () => {
    expect(PICKUP_DISTANCE).toBe(3.0);

    const dropAtBoundary = dropManager.spawn(10.5 + 3.0, 10.0, 10.5, BLOCK_TYPES.SAND);
    const dropBeyondBoundary = dropManager.spawn(10.5 + 3.05, 10.0, 10.5, BLOCK_TYPES.GRASS);

    dropManager.update(0.05, player, inventory);

    // 剛好在 3.0 格內被撿起
    expect(inventory.getItemCount(BLOCK_TYPES.SAND)).toBe(1);
    expect(dropManager.drops).not.toContain(dropAtBoundary);

    // 超過 3.0 格（3.05 格）不被撿起
    expect(inventory.getItemCount(BLOCK_TYPES.GRASS)).toBe(0);
    expect(dropManager.drops).toContain(dropBeyondBoundary);
  });

  it('連續撿起不同種類的小方塊（泥土、石頭），快捷欄分別累積對應數字', () => {
    dropManager.spawn(10.5 + 1.0, 10.0, 10.5, BLOCK_TYPES.DIRT);
    dropManager.spawn(10.5, 10.0, 10.5 + 1.5, BLOCK_TYPES.DIRT);
    dropManager.spawn(10.5 - 2.0, 10.0, 10.5, BLOCK_TYPES.STONE);
    const farSand = dropManager.spawn(10.5 + 5.0, 10.0, 10.5, BLOCK_TYPES.SAND);

    dropManager.update(0.05, player, inventory);

    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(2);
    expect(inventory.getItemCount(BLOCK_TYPES.STONE)).toBe(1);
    expect(inventory.getItemCount(BLOCK_TYPES.SAND)).toBe(0);
    expect(dropManager.drops.length).toBe(1);
    expect(dropManager.drops).toContain(farSand);
  });
});
