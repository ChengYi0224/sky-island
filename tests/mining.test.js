import { describe, it, expect, beforeEach } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { MiningController, MINING_TIMES, MAX_MINING_DISTANCE } from '../src/logic/mining.js';

describe('STEP 1: 挖方塊邏輯 (mining.js)', () => {
  let world;
  let mining;

  beforeEach(() => {
    world = new World();
    mining = new MiningController(world);
  });

  it('按住左鍵挖泥土/草地/沙子：裂痕階段遞增，不到 1 秒方塊消失', () => {
    const target = { x: 10, y: 10, z: 10 };
    const playerPos = { x: 10, y: 10, z: 8 }; // 距離 2 格
    world.setBlock(target.x, target.y, target.z, BLOCK_TYPES.DIRT);

    expect(MINING_TIMES[BLOCK_TYPES.DIRT]).toBeLessThan(1.0);
    expect(MINING_TIMES[BLOCK_TYPES.DIRT]).toBeGreaterThan(0);

    const dirtTime = MINING_TIMES[BLOCK_TYPES.DIRT];
    const dt = dirtTime / 4;

    // 累積進度 25%
    mining.update(dt, { isMining: true, target, playerPos });
    expect(mining.progress).toBeCloseTo(0.25, 2);
    expect(mining.stage).toBeGreaterThanOrEqual(0);
    const firstStage = mining.stage;

    // 累積進度 75%
    mining.update(dt * 2, { isMining: true, target, playerPos });
    expect(mining.progress).toBeCloseTo(0.75, 2);
    expect(mining.stage).toBeGreaterThan(firstStage); // 越裂越大
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.DIRT);

    // 累積進度達到 100%
    mining.update(dt, { isMining: true, target, playerPos });
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.AIR);
    expect(mining.progress).toBe(0);
    expect(mining.stage).toBe(0);
  });

  it('不可以：只點一下就不見（短時間點擊方塊不會被破壞）', () => {
    const target = { x: 10, y: 10, z: 10 };
    const playerPos = { x: 10, y: 10, z: 9 };
    world.setBlock(target.x, target.y, target.z, BLOCK_TYPES.DIRT);

    // 僅點擊 0.05 秒（一瞬間）
    mining.update(0.05, { isMining: true, target, playerPos });
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.DIRT);
    expect(mining.progress).toBeLessThan(1.0);

    // 隨即放開滑鼠
    mining.update(0.01, { isMining: false, target, playerPos });
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.DIRT);
  });

  it('挖到一半放開：裂痕消失且進度重置，下次需從頭挖起', () => {
    const target = { x: 10, y: 10, z: 10 };
    const playerPos = { x: 10, y: 10, z: 9 };
    world.setBlock(target.x, target.y, target.z, BLOCK_TYPES.GRASS);

    const totalTime = MINING_TIMES[BLOCK_TYPES.GRASS];

    // 挖到一半
    mining.update(totalTime * 0.5, { isMining: true, target, playerPos });
    expect(mining.progress).toBeCloseTo(0.5, 2);
    expect(mining.stage).toBeGreaterThan(0);

    // 放開左鍵
    mining.update(0.01, { isMining: false, target, playerPos });
    expect(mining.progress).toBe(0);
    expect(mining.stage).toBe(0);
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.GRASS);

    // 再次按住挖掘，若只挖原本剩餘的 0.5 時間不能破壞（必須從頭累積滿 totalTime）
    mining.update(totalTime * 0.5, { isMining: true, target, playerPos });
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.GRASS);
    expect(mining.progress).toBeCloseTo(0.5, 2);

    // 繼續補滿剩下 0.5 才破壞
    mining.update(totalTime * 0.5, { isMining: true, target, playerPos });
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.AIR);
  });

  it('挖石頭比泥土久，大約 2 秒', () => {
    const stoneTarget = { x: 10, y: 10, z: 10 };
    const dirtTarget = { x: 12, y: 10, z: 10 };
    const playerPos = { x: 10, y: 10, z: 9 };

    world.setBlock(stoneTarget.x, stoneTarget.y, stoneTarget.z, BLOCK_TYPES.STONE);
    world.setBlock(dirtTarget.x, dirtTarget.y, dirtTarget.z, BLOCK_TYPES.DIRT);

    const stoneTime = MINING_TIMES[BLOCK_TYPES.STONE];
    const dirtTime = MINING_TIMES[BLOCK_TYPES.DIRT];

    // 石頭時間約 2 秒，且比泥土久
    expect(stoneTime).toBeGreaterThan(dirtTime);
    expect(stoneTime).toBeGreaterThanOrEqual(1.8);
    expect(stoneTime).toBeLessThanOrEqual(2.2);

    // 挖掘石頭經過泥土所需時間（< 1s）後，石頭尚未被破壞
    mining.update(dirtTime, { isMining: true, target: stoneTarget, playerPos });
    expect(world.getBlock(stoneTarget.x, stoneTarget.y, stoneTarget.z)).toBe(BLOCK_TYPES.STONE);
    expect(mining.progress).toBeLessThan(1.0);

    // 繼續累積直到接近 2 秒前
    mining.update(stoneTime - dirtTime - 0.1, { isMining: true, target: stoneTarget, playerPos });
    expect(world.getBlock(stoneTarget.x, stoneTarget.y, stoneTarget.z)).toBe(BLOCK_TYPES.STONE);

    // 滿 2 秒（總時間達到 stoneTime）後石頭被挖掉
    mining.update(0.1, { isMining: true, target: stoneTarget, playerPos });
    expect(world.getBlock(stoneTarget.x, stoneTarget.y, stoneTarget.z)).toBe(BLOCK_TYPES.AIR);
  });

  it('挖到一半把準星移開到別的方塊或空氣：原本方塊的裂痕立刻消失，挖掘進度歸零', () => {
    const targetA = { x: 10, y: 10, z: 10 };
    const targetB = { x: 10, y: 10, z: 11 };
    const playerPos = { x: 10, y: 10, z: 9 };
    world.setBlock(targetA.x, targetA.y, targetA.z, BLOCK_TYPES.STONE);
    world.setBlock(targetB.x, targetB.y, targetB.z, BLOCK_TYPES.STONE);

    // 挖 targetA 到一半
    mining.update(1.0, { isMining: true, target: targetA, playerPos });
    expect(mining.progress).toBeGreaterThan(0);
    expect(mining.stage).toBeGreaterThan(0);

    // 移開到空氣 (target: null)
    mining.update(0.01, { isMining: true, target: null, playerPos });
    expect(mining.progress).toBe(0);
    expect(mining.stage).toBe(0);
    expect(world.getBlock(targetA.x, targetA.y, targetA.z)).toBe(BLOCK_TYPES.STONE);

    // 重新挖 targetA 0.5 秒後移到 targetB
    mining.update(0.5, { isMining: true, target: targetA, playerPos });
    expect(mining.progress).toBeCloseTo(0.5 / MINING_TIMES[BLOCK_TYPES.STONE], 2);

    mining.update(0.1, { isMining: true, target: targetB, playerPos });
    // 切換到新目標時，進度應針對新方塊重新累積
    expect(mining.target).toEqual(targetB);
    expect(mining.progress).toBeCloseTo(0.1 / MINING_TIMES[BLOCK_TYPES.STONE], 2);
  });

  it('不可以隔太遠挖方塊：超過 4 格不累積進度也不會破壞方塊', () => {
    expect(MAX_MINING_DISTANCE).toBe(4);

    const farTarget = { x: 10, y: 10, z: 15 };
    const playerPos = { x: 10, y: 10, z: 10 }; // 距離 5 格 (> 4 格)
    world.setBlock(farTarget.x, farTarget.y, farTarget.z, BLOCK_TYPES.DIRT);

    // 在 5 格距離按住左鍵挖 2 秒
    mining.update(2.0, { isMining: true, target: farTarget, playerPos });
    expect(mining.progress).toBe(0);
    expect(mining.stage).toBe(0);
    expect(world.getBlock(farTarget.x, farTarget.y, farTarget.z)).toBe(BLOCK_TYPES.DIRT);

    // 玩家靠近到距離 3 格 (<= 4 格)
    const closePlayerPos = { x: 10, y: 10, z: 12 };
    mining.update(MINING_TIMES[BLOCK_TYPES.DIRT], { isMining: true, target: farTarget, playerPos: closePlayerPos });
    expect(world.getBlock(farTarget.x, farTarget.y, farTarget.z)).toBe(BLOCK_TYPES.AIR);
  });
});
