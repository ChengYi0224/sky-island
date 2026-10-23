import { describe, it, expect, beforeEach } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { Player } from '../src/logic/player.js';
import { SandManager } from '../src/logic/sand.js';
import { HealthSystem } from '../src/logic/health.js';

describe('沙子掩埋與窒息傷害 (tests/sand-bury.test.js)', () => {
  const dt = 1 / 60;
  let world;

  beforeEach(() => {
    world = new World();
  });

  function tick(player, sandManager, healthSystem, input = {}) {
    player.update(dt, input);
    sandManager.update(dt);
    healthSystem.update(dt);
  }

  it('1. 兩顆沙子從上方下落砸到玩家，第二顆落在頭部格：停在頭部 (10,6,10)、玩家留在 y 約 5、扣血', () => {
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5 });
    const sandManager = new SandManager(world);
    const healthSystem = new HealthSystem(player, world);

    // 先 tick 幾次讓 onGround 為 true
    for (let i = 0; i < 10; i++) {
      tick(player, sandManager, healthSystem);
    }
    expect(player.onGround).toBe(true);

    // 在玩家頭頂上方 (10, 9, 10) 放置沙子 entity
    sandManager.spawn(10, 9, 10);
    sandManager.spawn(10, 10, 10); // 第二顆疊在第一顆上面，落在頭部格

    // 跑 2 秒物理 (120 ticks)
    for (let i = 0; i < 120; i++) {
      tick(player, sandManager, healthSystem);
    }

    // 預期：沙子停在頭的格子 (10,6,10)，world.getBlock 為 SAND
    expect(world.getBlock(10, 6, 10)).toBe(BLOCK_TYPES.SAND);

    // 玩家 y 仍約 5（不可以 >= 6.5，容許 0.01 誤差）
    expect(player.y).toBeCloseTo(5, 1);
    expect(player.y).toBeLessThan(6.5 - 0.01);

    // 血量小於 20
    expect(healthSystem.health).toBeLessThan(20);
  });

  it('1b. 只有一顆沙子砸下來：落在腳部格 (10,5,10)，玩家不被傳送到沙子上面、頭在空氣中不扣血', () => {
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5 });
    const sandManager = new SandManager(world);
    const healthSystem = new HealthSystem(player, world);
    for (let i = 0; i < 10; i++) tick(player, sandManager, healthSystem);

    sandManager.spawn(10, 9, 10);
    for (let i = 0; i < 120; i++) tick(player, sandManager, healthSystem);

    expect(world.getBlock(10, 5, 10)).toBe(BLOCK_TYPES.SAND);
    expect(player.y).toBeLessThan(5.5);
    expect(healthSystem.health).toBe(20);
  });

  it('2. 挖掉支撐方塊引發沙子下落砸頭：停在頭部 (10,6,10)、玩家留在 y 約 5、扣血', () => {
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5 });
    const sandManager = new SandManager(world);
    const healthSystem = new HealthSystem(player, world);

    // 先 tick 幾次讓 onGround 為 true
    for (let i = 0; i < 10; i++) {
      tick(player, sandManager, healthSystem);
    }
    expect(player.onGround).toBe(true);

    // 先在 (10,7,10) 放沙、(10,6,10) 放石頭支撐
    world.setBlock(10, 7, 10, BLOCK_TYPES.SAND);
    world.setBlock(10, 8, 10, BLOCK_TYPES.SAND);
    world.setBlock(10, 6, 10, BLOCK_TYPES.STONE);

    // 再把 (10,6,10) 設成 AIR 後呼叫 sandManager.onBlockBreak(10,6,10)
    world.setBlock(10, 6, 10, BLOCK_TYPES.AIR);
    sandManager.onBlockBreak(10, 6, 10);

    // 跑 2 秒物理 (120 ticks)
    for (let i = 0; i < 120; i++) {
      tick(player, sandManager, healthSystem);
    }

    // 預期同上（玩家沒被推到沙頂上、頭格是沙、血量減少）
    expect(world.getBlock(10, 6, 10)).toBe(BLOCK_TYPES.SAND);
    expect(player.y).toBeCloseTo(5, 1);
    expect(player.y).toBeLessThan(6.5 - 0.01);
    expect(healthSystem.health).toBeLessThan(20);
  });

  it('3. 持續扣血：沙子落在頭上後再跑 3 秒，血量約減少 6 點（容許 ±1），玩家 y 仍約 5', () => {
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5 });
    const sandManager = new SandManager(world);
    const healthSystem = new HealthSystem(player, world);

    // 先 tick 幾次讓 onGround 為 true
    for (let i = 0; i < 10; i++) {
      tick(player, sandManager, healthSystem);
    }

    // 在玩家頭頂上方生成沙子並等待其落地（跑 2 秒）
    sandManager.spawn(10, 9, 10);
    sandManager.spawn(10, 10, 10);
    for (let i = 0; i < 120; i++) {
      tick(player, sandManager, healthSystem);
    }

    const healthAfterLand = healthSystem.health;

    // 沙子落在頭上後再跑 3 秒 (180 ticks)
    for (let i = 0; i < 180; i++) {
      tick(player, sandManager, healthSystem);
    }

    const damageDealt = healthAfterLand - healthSystem.health;
    expect(damageDealt).toBeGreaterThanOrEqual(5);
    expect(damageDealt).toBeLessThanOrEqual(7);
    expect(player.y).toBeCloseTo(5, 1);
    expect(player.y).toBeLessThan(6.5 - 0.01);
  });

  it('4. 被方塊卡住時不會被瞬移到方塊上方：直接 setBlock 沙方塊在頭部，跑 30 次玩家 y < 6', () => {
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5 });

    for (let i = 0; i < 10; i++) {
      player.update(dt);
    }
    expect(player.y).toBe(5);

    // 直接把沙方塊 setBlock 在玩家頭的格子 (10,6,10)
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);

    // player.update 跑 30 次
    for (let i = 0; i < 30; i++) {
      player.update(dt);
    }

    // 玩家 y 要 < 6（不能被頂到 7）
    expect(player.y).toBeLessThan(6);
  });

  it('5. 被卡住也不能被橫向瞬移：同情境，玩家 x、z 跑 30 次後仍約 10.5（沒有輸入時）', () => {
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5 });

    for (let i = 0; i < 10; i++) {
      player.update(dt);
    }
    expect(player.y).toBe(5);

    // 直接把沙方塊 setBlock 在玩家頭的格子 (10,6,10)
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);

    // 沒有輸入時跑 30 次
    for (let i = 0; i < 30; i++) {
      player.update(dt);
    }

    // 驗證處於被方塊卡住狀態（未被瞬移至頂部）且水平座標未被橫向瞬移
    expect(player.y).toBeLessThan(6);
    expect(player.x).toBeCloseTo(10.5, 2);
    expect(player.z).toBeCloseTo(10.5, 2);
  });

  it('6. 玩家被埋住時仍可自己走出去：頭部格是沙，按 w 走 1 秒，玩家 z 應比 10.5 至少小 0.5', () => {
    for (let z = 5; z <= 15; z++) {
      world.setBlock(10, 4, z, BLOCK_TYPES.STONE);
    }
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5, yaw: 0 });

    for (let i = 0; i < 10; i++) {
      player.update(dt);
    }
    expect(player.y).toBe(5);

    // 頭部格 (10,6,10) 是沙，旁邊 (10,6,9) 是空氣
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);
    world.setBlock(10, 6, 9, BLOCK_TYPES.AIR);
    world.setBlock(10, 5, 9, BLOCK_TYPES.AIR);

    // 按 w（yaw=0 往 -z 走）走 1 秒 (60 ticks)
    for (let i = 0; i < 60; i++) {
      player.update(dt, { w: true });
    }

    // 玩家 z 應比 10.5 小（至少小 0.5）
    expect(player.z).toBeLessThanOrEqual(10.5 - 0.5);
  });

  it('7. 迴歸：不埋住時站立維持 y=5 且 onGround、撞牆阻擋、跳躍落地正常', () => {
    for (let z = 5; z <= 15; z++) {
      world.setBlock(10, 4, z, BLOCK_TYPES.STONE);
    }
    const player = new Player(world, { x: 10.5, y: 5, z: 10.5, yaw: 0 });

    // 不埋住時，站在地面 y 維持 5 且 onGround 為 true
    for (let i = 0; i < 10; i++) {
      player.update(dt);
    }
    expect(player.y).toBeCloseTo(5, 2);
    expect(player.onGround).toBe(true);

    // 往前走遇到牆（在 (10,5,8) 與 (10,6,8) 放石頭）
    world.setBlock(10, 5, 8, BLOCK_TYPES.STONE);
    world.setBlock(10, 6, 8, BLOCK_TYPES.STONE);

    // 往前走 (60 ticks)
    for (let i = 0; i < 60; i++) {
      player.update(dt, { w: true });
    }

    // 會被擋住，z 不會小於 8+1+0.3 -0.01
    expect(player.z).toBeGreaterThanOrEqual(8 + 1 + 0.3 - 0.01);

    // 跳起來再落地回到 y=5
    player.update(dt, { space: true });
    for (let i = 0; i < 60; i++) {
      player.update(dt);
    }
    expect(player.y).toBeCloseTo(5, 2);
    expect(player.onGround).toBe(true);
  });
});
