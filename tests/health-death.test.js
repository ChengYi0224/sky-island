import { describe, it, expect, beforeEach, vi } from 'vitest';
import { World, BLOCK_TYPES, SPAWN_POINT } from '../src/logic/world.js';
import { Player } from '../src/logic/player.js';
import { HealthSystem, MAX_HEALTH } from '../src/logic/health.js';
import { Inventory } from '../src/logic/inventory.js';
import { MiningController } from '../src/logic/mining.js';

describe('STEP 5c: 玩家死亡狀態判斷與 player.dead 同步 (HealthSystem.isDead)', () => {
  let world;
  let player;
  let healthSystem;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 5.0, z: 10.5 });
    healthSystem = new HealthSystem(player, world);
  });

  it('生命值大於 0 時 isDead() 為 false，且 player.dead 為 false', () => {
    expect(healthSystem.isDead()).toBe(false);
    expect(player.dead).toBe(false);

    healthSystem.takeDamage(10);
    expect(healthSystem.isDead()).toBe(false);
    expect(player.dead).toBe(false);
  });

  it('生命值歸零時 isDead() 為 true，且同步更新 player.dead 為 true', () => {
    healthSystem.takeDamage(20);
    expect(healthSystem.health).toBe(0);
    expect(healthSystem.isDead()).toBe(true);
    expect(player.dead).toBe(true);
  });

  it('呼叫 reset() 後生命值回到滿血，isDead() 為 false 且 player.dead 恢復為 false', () => {
    healthSystem.takeDamage(20);
    expect(healthSystem.isDead()).toBe(true);
    expect(player.dead).toBe(true);

    healthSystem.reset();
    expect(healthSystem.health).toBe(MAX_HEALTH);
    expect(healthSystem.isDead()).toBe(false);
    expect(player.dead).toBe(false);
  });
});

describe('STEP 5c: 死亡後傷害免疫與窒息停止', () => {
  let world;
  let player;
  let healthSystem;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 5.0, z: 10.5 });
    healthSystem = new HealthSystem(player, world);
  });

  it('死亡後呼叫 takeDamage 無效，health 保持 0 不會變負數', () => {
    healthSystem.takeDamage(20);
    expect(healthSystem.isDead()).toBe(true);
    expect(healthSystem.health).toBe(0);

    healthSystem.takeDamage(10);
    expect(healthSystem.health).toBe(0);

    healthSystem.takeDamage(100);
    expect(healthSystem.health).toBe(0);
  });

  it('死亡後處於沙子窒息環境中呼叫 update(dt)，不再扣血且 health 保持 0', () => {
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);
    healthSystem.takeDamage(20);
    expect(healthSystem.isDead()).toBe(true);

    healthSystem.update(5.0);
    expect(healthSystem.health).toBe(0);
  });
});

describe('STEP 5c: 重生機制 (HealthSystem.respawn)', () => {
  let world;
  let player;
  let healthSystem;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 5.0, z: 10.5 });
    healthSystem = new HealthSystem(player, world);
  });

  it('呼叫 respawn() 後玩家回到預設 SPAWN_POINT 且速度 vx, vy, vz 歸零', () => {
    player.x = 5.0;
    player.y = 2.0;
    player.z = 5.0;
    player.vx = 4.0;
    player.vy = 8.0;
    player.vz = -3.0;

    healthSystem.takeDamage(20);
    expect(healthSystem.isDead()).toBe(true);

    healthSystem.respawn();

    expect(player.x).toBe(SPAWN_POINT.x);
    expect(player.y).toBe(SPAWN_POINT.y);
    expect(player.z).toBe(SPAWN_POINT.z);
    expect(player.vx).toBe(0);
    expect(player.vy).toBe(0);
    expect(player.vz).toBe(0);
  });

  it('支援以 options.spawn 自訂出生點，呼叫 respawn() 回到指定座標', () => {
    const customSpawn = { x: 7.5, y: 15.0, z: 8.5 };
    const customHealthSystem = new HealthSystem(player, world, { spawn: customSpawn });

    player.x = 20.0;
    player.y = 1.0;
    player.z = 20.0;
    customHealthSystem.takeDamage(20);
    customHealthSystem.respawn();

    expect(player.x).toBe(customSpawn.x);
    expect(player.y).toBe(customSpawn.y);
    expect(player.z).toBe(customSpawn.z);
  });

  it('呼叫 respawn() 後 health 回到 maxHealth(20)、player.dead 為 false 且窒息計時歸零', () => {
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);
    healthSystem.update(0.3);
    healthSystem.takeDamage(20);

    expect(healthSystem.isDead()).toBe(true);
    expect(player.dead).toBe(true);

    healthSystem.respawn();

    expect(healthSystem.health).toBe(MAX_HEALTH);
    expect(healthSystem.isDead()).toBe(false);
    expect(player.dead).toBe(false);
    expect(healthSystem.suffocationTimer).toBe(0);
  });

  it('呼叫 respawn() 前後，Inventory 背包內容完全不變（各格 type 與 count 相同）', () => {
    const inventory = new Inventory(9);
    inventory.addItem(BLOCK_TYPES.DIRT, 5);
    inventory.addItem(BLOCK_TYPES.STONE, 3);
    inventory.addItem(BLOCK_TYPES.SAND, 10);

    const beforeSlots = inventory.slots.map((s) => ({ type: s.type, count: s.count }));

    healthSystem.takeDamage(20);
    healthSystem.respawn();

    expect(inventory.slots.length).toBe(beforeSlots.length);
    for (let i = 0; i < inventory.slots.length; i++) {
      expect(inventory.slots[i].type).toBe(beforeSlots[i].type);
      expect(inventory.slots[i].count).toBe(beforeSlots[i].count);
    }
  });

  it('玩家活著時呼叫 respawn() 也能正常執行不出錯，位置重置且維持正常狀態', () => {
    player.x = 25.0;
    player.y = 5.0;
    player.z = 25.0;
    player.vx = 2.0;

    expect(() => healthSystem.respawn()).not.toThrow();
    expect(player.x).toBe(SPAWN_POINT.x);
    expect(player.y).toBe(SPAWN_POINT.y);
    expect(player.z).toBe(SPAWN_POINT.z);
    expect(player.vx).toBe(0);
    expect(healthSystem.health).toBe(MAX_HEALTH);
    expect(player.dead).toBe(false);
    expect(healthSystem.isDead()).toBe(false);
  });
});

describe('STEP 5c: 受傷事件與統計屬性 (damageCount, lastDamageTime, onDamage)', () => {
  let world;
  let player;
  let healthSystem;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 5.0, z: 10.5 });
    healthSystem = new HealthSystem(player, world);
  });

  it('初始狀態 damageCount 為 0，lastDamageTime 為 null', () => {
    expect(healthSystem.damageCount).toBe(0);
    expect(healthSystem.lastDamageTime).toBe(null);
  });

  it('受到有效傷害時 damageCount 累加 1，且 lastDamageTime 記錄 update 累計時間', () => {
    healthSystem.update(1.5);
    healthSystem.takeDamage(5);

    expect(healthSystem.damageCount).toBe(1);
    expect(healthSystem.lastDamageTime).toBe(1.5);

    healthSystem.update(0.8);
    healthSystem.takeDamage(3);

    expect(healthSystem.damageCount).toBe(2);
    expect(healthSystem.lastDamageTime).toBeCloseTo(2.3, 5);
  });

  it('無效傷害（amount <= 0、NaN 或已死亡）時 damageCount 不增加且 lastDamageTime 不更新', () => {
    healthSystem.update(1.0);

    healthSystem.takeDamage(0);
    healthSystem.takeDamage(-5);
    healthSystem.takeDamage(NaN);
    expect(healthSystem.damageCount).toBe(0);
    expect(healthSystem.lastDamageTime).toBe(null);

    healthSystem.takeDamage(20);
    expect(healthSystem.damageCount).toBe(1);
    expect(healthSystem.lastDamageTime).toBe(1.0);

    healthSystem.update(1.0);
    healthSystem.takeDamage(5);
    expect(healthSystem.damageCount).toBe(1);
    expect(healthSystem.lastDamageTime).toBe(1.0);
  });

  it('可選 onDamage 回呼函式：扣血時以實際扣除的血量數值被呼叫', () => {
    const onDamage = vi.fn();
    const hs = new HealthSystem(player, world, { onDamage });

    hs.takeDamage(6);
    expect(onDamage).toHaveBeenCalledTimes(1);
    expect(onDamage).toHaveBeenCalledWith(6);

    hs.takeDamage(50);
    expect(onDamage).toHaveBeenCalledTimes(2);
    expect(onDamage).toHaveBeenLastCalledWith(14);

    hs.takeDamage(10);
    expect(onDamage).toHaveBeenCalledTimes(2);
  });

  it('窒息傷害每 0.5 秒扣血時同步更新 damageCount、lastDamageTime 並觸發 onDamage', () => {
    const onDamage = vi.fn();
    const hs = new HealthSystem(player, world, { onDamage });

    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);

    hs.update(0.4);
    expect(hs.damageCount).toBe(0);
    expect(hs.lastDamageTime).toBe(null);
    expect(onDamage).not.toHaveBeenCalled();

    hs.update(0.1);
    expect(hs.damageCount).toBe(1);
    expect(hs.lastDamageTime).toBeCloseTo(0.5, 5);
    expect(onDamage).toHaveBeenCalledWith(1);

    hs.update(0.5);
    expect(hs.damageCount).toBe(2);
    expect(hs.lastDamageTime).toBeCloseTo(1.0, 5);
    expect(onDamage).toHaveBeenCalledTimes(2);
  });

  it('腳被埋在沙子中但頭部在空氣時，不造成傷害且不更新受傷統計', () => {
    const onDamage = vi.fn();
    const hs = new HealthSystem(player, world, { onDamage });

    world.setBlock(10, 5, 10, BLOCK_TYPES.SAND);
    world.setBlock(10, 6, 10, BLOCK_TYPES.AIR);

    hs.update(1.0);

    expect(hs.health).toBe(MAX_HEALTH);
    expect(hs.damageCount).toBe(0);
    expect(hs.lastDamageTime).toBe(null);
    expect(onDamage).not.toHaveBeenCalled();
  });
});

describe('STEP 5c: 死亡狀態對移動、放置與挖掘的限制', () => {
  let world;
  let player;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 5.0, z: 10.5 });
  });

  it('死亡時不能移動：player.dead 為 true 時 Player.update 不改變 x, y, z', () => {
    const startX = player.x;
    const startY = player.y;
    const startZ = player.z;

    player.dead = true;
    player.update(0.1, { w: true, space: true, a: true });

    expect(player.x).toBe(startX);
    expect(player.y).toBe(startY);
    expect(player.z).toBe(startZ);
  });

  it('迴歸測試：player 活著（player.dead 為 false）時 Player.update 正常移動', () => {
    player.dead = false;
    const startZ = player.z;

    player.update(0.1, { w: true });

    expect(player.z).not.toBe(startZ);
    expect(player.z).toBeLessThan(startZ);
  });

  it('死亡時不能放方塊：player.dead 為 true 時 inventory.placeBlock 回傳 false 且世界與背包皆不變', () => {
    const inventory = new Inventory(9);
    inventory.addItem(BLOCK_TYPES.DIRT, 3);
    inventory.selectSlot(0);

    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    const targetBlock = { x: 10, y: 4, z: 10 };
    const normal = { x: 0, y: 0, z: 1 };
    expect(world.getBlock(10, 4, 11)).toBe(BLOCK_TYPES.AIR);

    player.dead = true;
    const placed = inventory.placeBlock(world, player, targetBlock, normal);

    expect(placed).toBe(false);
    expect(inventory.getSelectedSlot().count).toBe(3);
    expect(world.getBlock(10, 4, 11)).toBe(BLOCK_TYPES.AIR);
  });

  it('死亡時不能挖方塊：MiningController.update 傳入 dead: true 時回傳 { broken: false } 且 progress 為 0', () => {
    const mining = new MiningController(world);
    const target = { x: 10, y: 5, z: 10 };
    const playerPos = { x: 10, y: 5, z: 8 };
    world.setBlock(target.x, target.y, target.z, BLOCK_TYPES.DIRT);

    const result = mining.update(5.0, {
      isMining: true,
      target,
      playerPos,
      dead: true,
    });

    expect(result.broken).toBe(false);
    expect(mining.progress).toBe(0);
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.DIRT);
  });

  it('迴歸測試：MiningController.update 未傳入 dead 時照常能挖掘破壞方塊', () => {
    const mining = new MiningController(world);
    const target = { x: 10, y: 5, z: 10 };
    const playerPos = { x: 10, y: 5, z: 8 };
    world.setBlock(target.x, target.y, target.z, BLOCK_TYPES.DIRT);

    const result = mining.update(0.65, {
      isMining: true,
      target,
      playerPos,
    });

    expect(result.broken).toBe(true);
    expect(world.getBlock(target.x, target.y, target.z)).toBe(BLOCK_TYPES.AIR);
  });
});

describe('STEP 5c: 窒息致死與重生完整流程整合', () => {
  it('窒息致死與重生完整流程：頭部埋沙扣血至死亡，重生後回到出生點不再扣血', () => {
    const world = new World();
    const player = new Player(world, { x: 10.5, y: 5.0, z: 10.5 });
    const healthSystem = new HealthSystem(player, world);

    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);

    expect(healthSystem.isSuffocating()).toBe(true);

    // 推進 10 秒（20 次 0.5 秒），扣滿 20 點生命值
    for (let i = 0; i < 20; i++) {
      healthSystem.update(0.5);
    }

    expect(healthSystem.health).toBe(0);
    expect(healthSystem.isDead()).toBe(true);
    expect(player.dead).toBe(true);

    // 死亡後再推進 10 秒，生命值依然為 0，不變為負數
    for (let i = 0; i < 20; i++) {
      healthSystem.update(0.5);
    }
    expect(healthSystem.health).toBe(0);

    // 呼叫 respawn()
    healthSystem.respawn();

    expect(healthSystem.health).toBe(MAX_HEALTH);
    expect(healthSystem.isDead()).toBe(false);
    expect(player.dead).toBe(false);
    expect(player.x).toBe(SPAWN_POINT.x);
    expect(player.y).toBe(SPAWN_POINT.y);
    expect(player.z).toBe(SPAWN_POINT.z);

    // 出生點不在沙子裡，不再觸發窒息
    expect(healthSystem.isSuffocating()).toBe(false);
    healthSystem.update(1.0);
    expect(healthSystem.health).toBe(MAX_HEALTH);
  });
});
