import { describe, it, expect } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { Player } from '../src/logic/player.js';

function createFlatPlatformWorld() {
  const world = new World();
  for (let x = 10; x <= 22; x++) {
    for (let z = 10; z <= 22; z++) {
      world.setBlock(x, 10, z, BLOCK_TYPES.STONE);
    }
  }
  return world;
}

describe('STEP 0: 玩家移動、碰撞與跳躍 (player.js)', () => {
  it('按 W、A、S、D 鍵可控制玩家前後左右水平移動', () => {
    const dt = 1 / 60;

    const worldW = createFlatPlatformWorld();
    const playerW = new Player(worldW, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    for (let i = 0; i < 15; i++) playerW.update(dt, { w: true });
    expect(playerW.z).toBeLessThan(16.5);

    const worldS = createFlatPlatformWorld();
    const playerS = new Player(worldS, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    for (let i = 0; i < 15; i++) playerS.update(dt, { s: true });
    expect(playerS.z).toBeGreaterThan(16.5);

    const worldA = createFlatPlatformWorld();
    const playerA = new Player(worldA, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    for (let i = 0; i < 15; i++) playerA.update(dt, { a: true });
    expect(playerA.x).toBeLessThan(16.5);

    const worldD = createFlatPlatformWorld();
    const playerD = new Player(worldD, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    for (let i = 0; i < 15; i++) playerD.update(dt, { d: true });
    expect(playerD.x).toBeGreaterThan(16.5);
  });

  it('碰到方塊側面時會被擋住，不會穿牆', () => {
    const world = createFlatPlatformWorld();
    world.setBlock(17, 11, 16, BLOCK_TYPES.STONE);
    world.setBlock(17, 12, 16, BLOCK_TYPES.STONE);

    const player = new Player(world, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    const dt = 1 / 60;

    for (let i = 0; i < 60; i++) {
      player.update(dt, { d: true });
    }

    const halfWidth = player.width / 2;
    expect(player.x + halfWidth).toBeLessThanOrEqual(17 + 1e-4);
    expect(player.x).toBeLessThan(17);
  });

  it('按空白鍵可往上跳起約 1 格高，並受重力落回方塊頂面', () => {
    const world = createFlatPlatformWorld();
    const player = new Player(world, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    const dt = 1 / 60;

    player.update(dt, {});
    expect(player.onGround).toBe(true);

    let maxY = player.y;
    player.update(dt, { space: true });

    for (let i = 0; i < 120; i++) {
      player.update(dt, {});
      if (player.y > maxY) {
        maxY = player.y;
      }
    }

    const jumpHeight = maxY - 11;
    expect(jumpHeight).toBeGreaterThan(1.0);
    expect(jumpHeight).toBeLessThan(1.5);
    expect(player.y).toBeCloseTo(11, 2);
    expect(player.onGround).toBe(true);
  });

  it('在空中時按空白鍵不可以無限二段跳', () => {
    const dt = 1 / 60;

    const worldSingle = createFlatPlatformWorld();
    const playerSingle = new Player(worldSingle, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    playerSingle.update(dt, {});
    let maxSingleY = playerSingle.y;
    playerSingle.update(dt, { space: true });
    for (let i = 0; i < 120; i++) {
      playerSingle.update(dt, {});
      if (playerSingle.y > maxSingleY) maxSingleY = playerSingle.y;
    }

    const worldDouble = createFlatPlatformWorld();
    const playerDouble = new Player(worldDouble, { x: 16.5, y: 11, z: 16.5, yaw: 0 });
    playerDouble.update(dt, {});
    let maxDoubleY = playerDouble.y;
    playerDouble.update(dt, { space: true });
    expect(playerDouble.onGround).toBe(false);

    for (let i = 0; i < 120; i++) {
      playerDouble.update(dt, { space: true });
      if (playerDouble.y > maxDoubleY) maxDoubleY = playerDouble.y;
    }

    expect(maxDoubleY).toBeCloseTo(maxSingleY, 4);
  });
});
