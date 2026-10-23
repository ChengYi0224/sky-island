import { describe, it, expect, beforeEach } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { SandManager, SandEntity, SAND_GRAVITY, SAND_MAX_SPEED } from '../src/logic/sand.js';

describe('STEP 5a: 沙子物理邏輯 (sand.js)', () => {
  let world;
  let sandManager;

  beforeEach(() => {
    world = new World();
    sandManager = new SandManager(world);
  });

  // 輔助函式：觸發指定位置沙子下落檢查（相容 triggerFall、checkAndTrigger、checkBlock）
  function triggerSand(manager, x, y, z) {
    if (typeof manager.triggerFall === 'function') {
      return manager.triggerFall(x, y, z);
    }
    if (typeof manager.checkAndTrigger === 'function') {
      return manager.checkAndTrigger(x, y, z);
    }
    if (typeof manager.checkBlock === 'function') {
      return manager.checkBlock(x, y, z);
    }
    return null;
  }

  // 輔助函式：取得向下速度大小
  function getDownwardSpeed(entity) {
    if (typeof entity.fallSpeed === 'number') {
      return entity.fallSpeed;
    }
    if (typeof entity.vy === 'number') {
      return Math.abs(entity.vy);
    }
    return 0;
  }

  it('匯出正確物理常數（SAND_GRAVITY = 20, SAND_MAX_SPEED = 16）', () => {
    expect(SAND_GRAVITY).toBe(20);
    expect(SAND_MAX_SPEED).toBe(16);
  });

  it('下方沒有方塊時轉成 entity 並向下運動（放置在懸空位置）', () => {
    // 在 (10, 10, 10) 放置沙子，下方 (10, 9, 10) 為空氣
    world.setBlock(10, 10, 10, BLOCK_TYPES.SAND);
    expect(world.getBlock(10, 9, 10)).toBe(BLOCK_TYPES.AIR);

    // 觸發下落檢查
    triggerSand(sandManager, 10, 10, 10);

    // 原方塊位置轉為空氣
    expect(world.getBlock(10, 10, 10)).toBe(BLOCK_TYPES.AIR);

    // 生成了沙子 entity
    expect(sandManager.entities.length).toBe(1);
    const entity = sandManager.entities[0];
    expect(entity.x).toBe(10);
    expect(entity.y).toBeCloseTo(10, 1);
    expect(entity.z).toBe(10);

    // 初始下落速度為 0
    expect(getDownwardSpeed(entity)).toBe(0);

    // 注入 dt = 0.1 秒，向下加速運動，y 座標減小
    sandManager.update(0.1);
    expect(getDownwardSpeed(entity)).toBeGreaterThan(0);
    expect(entity.y).toBeLessThan(10);
  });

  it('速度隨時間增加（重力加速度 20 格/秒²）但不超過速度上限 16 格/秒', () => {
    // 建立下落中的沙子 entity，置於高處且下方無阻擋
    const entity = typeof sandManager.spawn === 'function'
      ? sandManager.spawn(10, 30, 10)
      : new SandEntity(10, 30, 10);

    if (!sandManager.entities.includes(entity)) {
      sandManager.entities.push(entity);
    }

    // 初始速度為 0
    expect(getDownwardSpeed(entity)).toBe(0);

    // dt = 0.5 秒：向下速度增加 20 * 0.5 = 10 格/秒
    sandManager.update(0.5);
    expect(getDownwardSpeed(entity)).toBeCloseTo(10, 1);

    // 再注入 dt = 0.5 秒：理論速度為 10 + 20 * 0.5 = 20，但被上限截斷為 16 格/秒
    sandManager.update(0.5);
    expect(getDownwardSpeed(entity)).toBeCloseTo(16, 1);

    // 再注入 dt = 1.0 秒：維持等速 16 格/秒，不再繼續加速
    sandManager.update(1.0);
    expect(getDownwardSpeed(entity)).toBeCloseTo(16, 1);
  });

  it('同一垂直柱（同 X, Z）可同時存在多個下落中的沙子 entity 且不互相覆蓋或消失', () => {
    // 在同垂直柱不同高度生成兩個沙子 entity
    const e1 = typeof sandManager.spawn === 'function'
      ? sandManager.spawn(10, 20, 10)
      : new SandEntity(10, 20, 10);
    const e2 = typeof sandManager.spawn === 'function'
      ? sandManager.spawn(10, 25, 10)
      : new SandEntity(10, 25, 10);

    if (!sandManager.entities.includes(e1)) sandManager.entities.push(e1);
    if (!sandManager.entities.includes(e2)) sandManager.entities.push(e2);

    expect(sandManager.entities.length).toBe(2);

    // 注入 dt 更新物理
    sandManager.update(0.1);

    // 兩者皆持續存在，未互相吃掉或消失
    expect(sandManager.entities.length).toBe(2);
    expect(sandManager.entities).toContain(e1);
    expect(sandManager.entities).toContain(e2);
    expect(e1.y).toBeLessThan(20);
    expect(e2.y).toBeLessThan(25);
  });

  it('不可以穿透實體方塊：落地轉回方塊且停在實體方塊頂面', () => {
    // 在 y=5 放置石頭方塊作為地面，上方為空氣
    world.setBlock(10, 5, 10, BLOCK_TYPES.STONE);

    // 在 y=7 生成沙子 entity
    const entity = typeof sandManager.spawn === 'function'
      ? sandManager.spawn(10, 7, 10)
      : new SandEntity(10, 7, 10);
    if (!sandManager.entities.includes(entity)) {
      sandManager.entities.push(entity);
    }

    // 推進時間模擬下落，總計下落超過 2 格距離
    for (let i = 0; i < 20; i++) {
      sandManager.update(0.05);
    }

    // 沙子 entity 應已落地並從 entities 陣列移除
    expect(sandManager.entities.length).toBe(0);

    // 石頭上方 y=6 應轉回為沙子方塊
    expect(world.getBlock(10, 6, 10)).toBe(BLOCK_TYPES.SAND);

    // y=5 依然是石頭方塊，沙子沒有穿透進去
    expect(world.getBlock(10, 5, 10)).toBe(BLOCK_TYPES.STONE);
    // y=4 仍為預設方塊，未被穿透覆蓋
    expect(world.getBlock(10, 4, 10)).toBe(BLOCK_TYPES.AIR);
  });

  it('後落的沙子堆在先落的上面（由下往上依序堆疊成格）', () => {
    // 地面在 y=5 為石頭
    world.setBlock(10, 5, 10, BLOCK_TYPES.STONE);

    // 先後兩個沙子 entity，e1 在 y=7，e2 在 y=9
    const e1 = typeof sandManager.spawn === 'function'
      ? sandManager.spawn(10, 7, 10)
      : new SandEntity(10, 7, 10);
    const e2 = typeof sandManager.spawn === 'function'
      ? sandManager.spawn(10, 9, 10)
      : new SandEntity(10, 9, 10);

    if (!sandManager.entities.includes(e1)) sandManager.entities.push(e1);
    if (!sandManager.entities.includes(e2)) sandManager.entities.push(e2);

    // 推進足夠時間讓兩者皆下落著地
    for (let i = 0; i < 40; i++) {
      sandManager.update(0.05);
    }

    // 所有沙子 entity 皆著地轉為方塊
    expect(sandManager.entities.length).toBe(0);

    // 先落的在 y=6
    expect(world.getBlock(10, 6, 10)).toBe(BLOCK_TYPES.SAND);
    // 後落的堆在先落的上面，即 y=7
    expect(world.getBlock(10, 7, 10)).toBe(BLOCK_TYPES.SAND);
    // y=8 保持為空氣，不重疊在同一格
    expect(world.getBlock(10, 8, 10)).toBe(BLOCK_TYPES.AIR);
  });

  it('挖掉最底支撐整疊依序掉：垂直堆疊的多格沙子由下而上依序轉為 entity 掉落', () => {
    // 地面在 y=5 放石頭作為支撐
    world.setBlock(10, 5, 10, BLOCK_TYPES.STONE);
    // 上方垂直堆疊 3 格沙子：y=6, 7, 8
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);
    world.setBlock(10, 7, 10, BLOCK_TYPES.SAND);
    world.setBlock(10, 8, 10, BLOCK_TYPES.SAND);

    // 挖除最底部的支撐方塊 y=5（變為空氣）
    world.setBlock(10, 5, 10, BLOCK_TYPES.AIR);

    // 通知/觸發支撐被破壞事件或下落檢查
    if (typeof sandManager.onBlockBreak === 'function') {
      sandManager.onBlockBreak(10, 5, 10);
    } else {
      triggerSand(sandManager, 10, 6, 10);
    }

    // 整疊沙子方塊位置應皆轉為空氣，並轉為下落 entity
    expect(world.getBlock(10, 6, 10)).toBe(BLOCK_TYPES.AIR);
    expect(world.getBlock(10, 7, 10)).toBe(BLOCK_TYPES.AIR);
    expect(world.getBlock(10, 8, 10)).toBe(BLOCK_TYPES.AIR);

    // 3 個沙子 entity 生成並向下掉落
    expect(sandManager.entities.length).toBe(3);
  });
});
