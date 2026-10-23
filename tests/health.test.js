import { describe, it, expect, beforeEach } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { Player } from '../src/logic/player.js';
import { SandManager, SandEntity } from '../src/logic/sand.js';
import {
  HealthSystem,
  MAX_HEALTH,
  SUFFOCATION_INTERVAL,
  SUFFOCATION_DAMAGE,
} from '../src/logic/health.js';

describe('STEP 5b: 玩家生命值與窒息傷害 (health.js)', () => {
  let world;
  let player;
  let sandManager;
  let healthSystem;

  beforeEach(() => {
    world = new World();
    // 玩家腳底在 y=5，頭部在 y=6
    player = new Player(world, { x: 10.5, y: 5, z: 10.5 });
    sandManager = new SandManager(world);
    healthSystem = new HealthSystem(player, world);
  });

  it('預設 20 點：玩家預設滿血為 20 點', () => {
    expect(MAX_HEALTH).toBe(20);
    expect(healthSystem.maxHealth).toBe(20);
    expect(healthSystem.health).toBe(20);
  });

  it('沙子落地變成方塊、頭部格子是沙子 → 每 0.5 秒扣 1 點', () => {
    // 地面在 y=4
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    // 腳部在 y=5 先落有方塊支撐
    world.setBlock(10, 5, 10, BLOCK_TYPES.SAND);

    // 在玩家頭頂上方生成沙子 entity (y=8)
    const sand = typeof sandManager.spawn === 'function'
      ? sandManager.spawn(10, 8, 10)
      : new SandEntity(10, 8, 10);
    if (!sandManager.entities.includes(sand)) {
      sandManager.entities.push(sand);
    }

    // 更新沙子物理直到下落著地轉為方塊
    for (let i = 0; i < 20; i++) {
      sandManager.update(0.05);
    }

    // 沙子 entity 著地轉為方塊，落在玩家頭部位置 y=6
    expect(sandManager.entities.length).toBe(0);
    expect(world.getBlock(10, 6, 10)).toBe(BLOCK_TYPES.SAND);

    // 頭部格子是沙子，觸發窒息
    expect(healthSystem.isSuffocating()).toBe(true);

    // 時間推進 0.4 秒（未滿 0.5 秒）→ 血量維持 20 點
    healthSystem.update(0.4);
    expect(healthSystem.health).toBe(20);

    // 再推進 0.1 秒（累計滿 0.5 秒）→ 扣 1 點血量，變為 19 點
    healthSystem.update(0.1);
    expect(healthSystem.health).toBe(19);

    // 再推進 0.5 秒（累計 1.0 秒）→ 再扣 1 點血量，變為 18 點
    healthSystem.update(0.5);
    expect(healthSystem.health).toBe(18);
  });

  it('腳被埋頭沒埋不扣：窒息只判定頭部格是沙子方塊', () => {
    // 地面在 y=4
    world.setBlock(10, 4, 10, BLOCK_TYPES.STONE);
    // 腳部格子 y=5 是沙子方塊
    world.setBlock(10, 5, 10, BLOCK_TYPES.SAND);
    // 頭部格子 y=6 為空氣
    world.setBlock(10, 6, 10, BLOCK_TYPES.AIR);

    // 頭部不在沙子中，不應判定為窒息
    expect(healthSystem.isSuffocating()).toBe(false);

    // 推進 1.0 秒（超過 0.5 秒）
    healthSystem.update(1.0);

    // 血量依然為 20 點，不扣血
    expect(healthSystem.health).toBe(20);
  });

  it('挖開後停止並重置計時：挖開頭頂沙子後停止扣血且重置計時器', () => {
    // 頭部格子 y=6 放置沙子
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);
    expect(healthSystem.isSuffocating()).toBe(true);

    // 窒息累積 0.3 秒（尚未滿 0.5 秒，不扣血）
    healthSystem.update(0.3);
    expect(healthSystem.health).toBe(20);

    // 挖開頭頂沙子，變為空氣
    world.setBlock(10, 6, 10, BLOCK_TYPES.AIR);
    expect(healthSystem.isSuffocating()).toBe(false);

    // 挖開後推進 0.5 秒，血量維持 20 不扣血
    healthSystem.update(0.5);
    expect(healthSystem.health).toBe(20);

    // 再次被沙子覆蓋頭部
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);
    expect(healthSystem.isSuffocating()).toBe(true);

    // 計時器已重置，推進 0.3 秒不會扣血（若未重置累積 0.3+0.3=0.6 就會扣血）
    healthSystem.update(0.3);
    expect(healthSystem.health).toBe(20);

    // 再推進 0.2 秒（重新累計滿 0.5 秒）才扣 1 點血量
    healthSystem.update(0.2);
    expect(healthSystem.health).toBe(19);
  });

  it('走出沙子後停止扣血：玩家離開沙子方塊後立即停止窒息傷害', () => {
    // 頭部格子 y=6 原本有沙子
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);
    expect(healthSystem.isSuffocating()).toBe(true);

    healthSystem.update(0.5);
    expect(healthSystem.health).toBe(19);

    // 玩家橫向走出沙子格到 (11.5, 5, 10.5)，該處頭部 (11, 6, 10) 為空氣
    player.x = 11.5;
    expect(world.getBlock(11, 6, 10)).toBe(BLOCK_TYPES.AIR);
    expect(healthSystem.isSuffocating()).toBe(false);

    // 推進 1.0 秒，血量停在 19 不再扣除
    healthSystem.update(1.0);
    expect(healthSystem.health).toBe(19);
  });

  it('血量不低於 0：長時間處於窒息傷害下，血量最低扣至 0 點不再減少', () => {
    // 頭部格子放置沙子
    world.setBlock(10, 6, 10, BLOCK_TYPES.SAND);

    // 推進 15 秒（超過扣完 20 點所需的 10 秒）
    for (let i = 0; i < 30; i++) {
      healthSystem.update(0.5);
    }

    expect(healthSystem.health).toBe(0);

    // 繼續推進時間，血量依然維持 0，不低於 0
    healthSystem.update(1.0);
    expect(healthSystem.health).toBe(0);
  });

  it('非沙子方塊（如空氣、石頭）不觸發沙子窒息傷害', () => {
    // 頭部為石頭方塊，沙子窒息只針對沙子方塊
    world.setBlock(10, 6, 10, BLOCK_TYPES.STONE);
    expect(healthSystem.isSuffocating()).toBe(false);

    healthSystem.update(1.0);
    expect(healthSystem.health).toBe(20);
  });
});
