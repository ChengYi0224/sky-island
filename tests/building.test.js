import { describe, it, expect } from 'vitest';
import { World, BLOCK_TYPES, generateIsland, SPAWN_POINT } from '../src/logic/world.js';
import { Player } from '../src/logic/player.js';

describe('STEP 0b: 島嶼中央建築與出生點 (building.test.js)', () => {
  it('島中央（x、z 約 16）生成由木板、磚、原木組成的建築', () => {
    const world = new World();
    generateIsland(world);

    const buildingBlocks = [];
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        for (let z = 0; z < world.depth; z++) {
          const type = world.getBlock(x, y, z);
          if (
            type === BLOCK_TYPES.PLANKS ||
            type === BLOCK_TYPES.BRICK ||
            type === BLOCK_TYPES.LOG
          ) {
            buildingBlocks.push({ x, y, z, type });
          }
        }
      }
    }

    expect(buildingBlocks.length).toBeGreaterThan(0);

    const avgX = buildingBlocks.reduce((acc, b) => acc + b.x, 0) / buildingBlocks.length;
    const avgZ = buildingBlocks.reduce((acc, b) => acc + b.z, 0) / buildingBlocks.length;

    expect(Math.abs(avgX - 16)).toBeLessThanOrEqual(3);
    expect(Math.abs(avgZ - 16)).toBeLessThanOrEqual(3);
  });

  it('建築材質只使用木板、磚、原木，且全島無 LEAVES 等未規格方塊', () => {
    const world = new World();
    generateIsland(world);

    const validTypes = new Set(Object.values(BLOCK_TYPES));
    let leavesCount = 0;

    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        for (let z = 0; z < world.depth; z++) {
          const type = world.getBlock(x, y, z);
          expect(validTypes.has(type)).toBe(true);
          if (type === BLOCK_TYPES.LEAVES) {
            leavesCount++;
          }
        }
      }
    }

    expect(leavesCount).toBe(0);
  });

  it('建築未蓋在沙地上，且整個世界所有方塊皆在 32x32x32 邊界內', () => {
    const world = new World();
    generateIsland(world);

    let bottomLayerSolid = 0;
    let topLayerSolid = 0;

    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        for (let z = 0; z < world.depth; z++) {
          const type = world.getBlock(x, y, z);
          const isBuilding =
            type === BLOCK_TYPES.PLANKS ||
            type === BLOCK_TYPES.BRICK ||
            type === BLOCK_TYPES.LOG;

          if (isBuilding) {
            const below = world.getBlock(x, y - 1, z);
            expect(below).not.toBe(BLOCK_TYPES.SAND);

            for (let cy = y - 1; cy >= 0; cy--) {
              const columnBlock = world.getBlock(x, cy, z);
              expect(columnBlock).not.toBe(BLOCK_TYPES.SAND);
            }
          }

          if (y === 0 && type !== BLOCK_TYPES.AIR) {
            bottomLayerSolid++;
          }
          if (y === world.height - 1 && type !== BLOCK_TYPES.AIR) {
            topLayerSolid++;
          }
        }
      }
    }

    expect(bottomLayerSolid).toBe(0);
    expect(topLayerSolid).toBe(0);
  });

  it('建築內部具備至少 2 格高的站立空間，且外牆設有 2 格高的門口連通至外部', () => {
    const world = new World();
    generateIsland(world);

    const buildingBlocks = [];
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        for (let z = 0; z < world.depth; z++) {
          const type = world.getBlock(x, y, z);
          if (
            type === BLOCK_TYPES.PLANKS ||
            type === BLOCK_TYPES.BRICK ||
            type === BLOCK_TYPES.LOG
          ) {
            buildingBlocks.push({ x, y, z });
          }
        }
      }
    }

    expect(buildingBlocks.length).toBeGreaterThan(0);

    const minX = Math.min(...buildingBlocks.map((b) => b.x));
    const maxX = Math.max(...buildingBlocks.map((b) => b.x));
    const minZ = Math.min(...buildingBlocks.map((b) => b.z));
    const maxZ = Math.max(...buildingBlocks.map((b) => b.z));
    const minY = Math.min(...buildingBlocks.map((b) => b.y));
    const maxY = Math.max(...buildingBlocks.map((b) => b.y));

    const insideSpots = [];
    for (let x = minX + 1; x <= maxX - 1; x++) {
      for (let z = minZ + 1; z <= maxZ - 1; z++) {
        for (let y = minY; y <= maxY; y++) {
          const hasFloor = world.isSolid(x, y - 1, z);
          const air1 = world.getBlock(x, y, z) === BLOCK_TYPES.AIR;
          const air2 = world.getBlock(x, y + 1, z) === BLOCK_TYPES.AIR;
          if (hasFloor && air1 && air2) {
            insideSpots.push({ x, y, z });
          }
        }
      }
    }

    expect(insideSpots.length).toBeGreaterThan(0);

    let doorwayFound = false;
    for (const spot of insideSpots) {
      const y = spot.y;
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          const isWallPerimeter = x === minX || x === maxX || z === minZ || z === maxZ;
          if (!isWallPerimeter) continue;

          const isDoorwayAir =
            world.getBlock(x, y, z) === BLOCK_TYPES.AIR &&
            world.getBlock(x, y + 1, z) === BLOCK_TYPES.AIR;

          if (isDoorwayAir) {
            const neighborsOutside = [
              { x: x - 1, z },
              { x: x + 1, z },
              { x, z: z - 1 },
              { x, z: z + 1 },
            ].filter(
              (n) => n.x < minX || n.x > maxX || n.z < minZ || n.z > maxZ
            );

            for (const out of neighborsOutside) {
              if (
                world.getBlock(out.x, y, out.z) === BLOCK_TYPES.AIR &&
                world.getBlock(out.x, y + 1, out.z) === BLOCK_TYPES.AIR
              ) {
                doorwayFound = true;
                break;
              }
            }
          }
          if (doorwayFound) break;
        }
        if (doorwayFound) break;
      }
      if (doorwayFound) break;
    }

    expect(doorwayFound).toBe(true);
  });

  it('玩家置於室內不卡牆，且可通過門口移動至建築外', () => {
    const world = new World();
    generateIsland(world);

    const buildingBlocks = [];
    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        for (let z = 0; z < world.depth; z++) {
          const type = world.getBlock(x, y, z);
          if (
            type === BLOCK_TYPES.PLANKS ||
            type === BLOCK_TYPES.BRICK ||
            type === BLOCK_TYPES.LOG
          ) {
            buildingBlocks.push({ x, y, z });
          }
        }
      }
    }

    expect(buildingBlocks.length).toBeGreaterThan(0);

    const minX = Math.min(...buildingBlocks.map((b) => b.x));
    const maxX = Math.max(...buildingBlocks.map((b) => b.x));
    const minZ = Math.min(...buildingBlocks.map((b) => b.z));
    const maxZ = Math.max(...buildingBlocks.map((b) => b.z));
    const minY = Math.min(...buildingBlocks.map((b) => b.y));
    const maxY = Math.max(...buildingBlocks.map((b) => b.y));

    let indoorSpot = null;
    for (let x = minX + 1; x <= maxX - 1; x++) {
      for (let z = minZ + 1; z <= maxZ - 1; z++) {
        for (let y = minY; y <= maxY; y++) {
          if (
            world.isSolid(x, y - 1, z) &&
            world.getBlock(x, y, z) === BLOCK_TYPES.AIR &&
            world.getBlock(x, y + 1, z) === BLOCK_TYPES.AIR
          ) {
            indoorSpot = { x: x + 0.5, y, z: z + 0.5 };
            break;
          }
        }
        if (indoorSpot) break;
      }
      if (indoorSpot) break;
    }

    expect(indoorSpot).not.toBeNull();

    const player = new Player(world, {
      x: indoorSpot.x,
      y: indoorSpot.y,
      z: indoorSpot.z,
    });

    const box = player.getBoundingBox();
    for (let bx = Math.floor(box.minX); bx <= Math.floor(box.maxX); bx++) {
      for (let by = Math.floor(box.minY); by <= Math.floor(box.maxY - 1e-4); by++) {
        for (let bz = Math.floor(box.minZ); bz <= Math.floor(box.maxZ); bz++) {
          expect(world.isSolid(bx, by, bz)).toBe(false);
        }
      }
    }

    const startKey = `${Math.floor(indoorSpot.x)},${Math.floor(indoorSpot.z)}`;
    const floorY = indoorSpot.y;
    const queue = [[Math.floor(indoorSpot.x), Math.floor(indoorSpot.z)]];
    const visited = new Set([startKey]);
    let reachedOutside = false;

    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    while (queue.length > 0) {
      const [cx, cz] = queue.shift();

      if (cx < minX || cx > maxX || cz < minZ || cz > maxZ) {
        reachedOutside = true;
        break;
      }

      for (const [dx, dz] of dirs) {
        const nx = cx + dx;
        const nz = cz + dz;
        const nKey = `${nx},${nz}`;
        if (visited.has(nKey)) continue;

        const isWalkable =
          world.isSolid(nx, floorY - 1, nz) &&
          world.getBlock(nx, floorY, nz) === BLOCK_TYPES.AIR &&
          world.getBlock(nx, floorY + 1, nz) === BLOCK_TYPES.AIR;

        if (isWalkable) {
          visited.add(nKey);
          queue.push([nx, nz]);
        }
      }
    }

    expect(reachedOutside).toBe(true);
  });

  it('SPAWN_POINT 在建築外面且腳下是實體方塊、頭上兩格是空氣', () => {
    const world = new World();
    generateIsland(world);

    expect(SPAWN_POINT).toBeDefined();
    expect(typeof SPAWN_POINT.x).toBe('number');
    expect(typeof SPAWN_POINT.y).toBe('number');
    expect(typeof SPAWN_POINT.z).toBe('number');

    const sx = Math.floor(SPAWN_POINT.x);
    const sy = Math.floor(SPAWN_POINT.y);
    const sz = Math.floor(SPAWN_POINT.z);

    expect(world.isInBounds(sx, sy, sz)).toBe(true);
    expect(world.isSolid(sx, sy - 1, sz)).toBe(true);
    expect(world.getBlock(sx, sy, sz)).toBe(BLOCK_TYPES.AIR);
    expect(world.getBlock(sx, sy + 1, sz)).toBe(BLOCK_TYPES.AIR);

    const footBlock = world.getBlock(sx, sy - 1, sz);
    expect(footBlock).not.toBe(BLOCK_TYPES.PLANKS);
    expect(footBlock).not.toBe(BLOCK_TYPES.BRICK);
    expect(footBlock).not.toBe(BLOCK_TYPES.LOG);

    const player = new Player(world, {
      x: SPAWN_POINT.x,
      y: SPAWN_POINT.y,
      z: SPAWN_POINT.z,
    });
    const box = player.getBoundingBox();
    for (let bx = Math.floor(box.minX); bx <= Math.floor(box.maxX); bx++) {
      for (let by = Math.floor(box.minY); by <= Math.floor(box.maxY - 1e-4); by++) {
        for (let bz = Math.floor(box.minZ); bz <= Math.floor(box.maxZ); bz++) {
          expect(world.isSolid(bx, by, bz)).toBe(false);
        }
      }
    }
  });
});
