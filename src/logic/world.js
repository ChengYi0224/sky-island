export const WORLD_SIZE = 32;

export const BLOCK_TYPES = Object.freeze({
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  LOG: 5,
  LEAVES: 6,
  PLANKS: 7,
  BRICK: 8,
});

export const SPAWN_POINT = Object.freeze({
  x: 11.5,
  y: 13,
  z: 16.5,
});

export class World {
  constructor(width = WORLD_SIZE, height = WORLD_SIZE, depth = WORLD_SIZE) {
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.blocks = new Uint8Array(width * height * depth);
  }

  _index(x, y, z) {
    return x + this.width * (z + this.depth * y);
  }

  isInBounds(x, y, z) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return false;
    }
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    return (
      ix >= 0 &&
      ix < this.width &&
      iy >= 0 &&
      iy < this.height &&
      iz >= 0 &&
      iz < this.depth
    );
  }

  getBlock(x, y, z) {
    if (!this.isInBounds(x, y, z)) {
      return BLOCK_TYPES.AIR;
    }
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    return this.blocks[this._index(ix, iy, iz)];
  }

  setBlock(x, y, z, type) {
    if (!this.isInBounds(x, y, z)) {
      return false;
    }
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);
    this.blocks[this._index(ix, iy, iz)] = type;
    return true;
  }

  isSolid(x, y, z) {
    return this.getBlock(x, y, z) !== BLOCK_TYPES.AIR;
  }

  canPlaceBlock(x, y, z, player = null) {
    if (!this.isInBounds(x, y, z)) {
      return false;
    }
    if (this.getBlock(x, y, z) !== BLOCK_TYPES.AIR) {
      return false;
    }
    if (player) {
      const box = typeof player.getBoundingBox === 'function'
        ? player.getBoundingBox()
        : {
            minX: player.x - (player.width ?? 0.6) / 2,
            maxX: player.x + (player.width ?? 0.6) / 2,
            minY: player.y,
            maxY: player.y + (player.height ?? 1.8),
            minZ: player.z - (player.width ?? 0.6) / 2,
            maxZ: player.z + (player.width ?? 0.6) / 2,
          };

      const overlapX = box.minX < x + 1 && box.maxX > x;
      const overlapY = box.minY < y + 1 && box.maxY > y;
      const overlapZ = box.minZ < z + 1 && box.maxZ > z;

      if (overlapX && overlapY && overlapZ) {
        return false;
      }
    }
    return true;
  }
}

export function generateIsland(world) {
  const cx = Math.floor(world.width / 2);
  const cz = Math.floor(world.depth / 2);
  const surfaceY = 12;
  const maxRadius = 6;

  for (let x = cx - maxRadius; x <= cx + maxRadius; x++) {
    for (let z = cz - maxRadius; z <= cz + maxRadius; z++) {
      const dx = x - cx;
      const dz = z - cz;
      const dist = Math.hypot(dx, dz);
      if (dist > maxRadius + 0.3) {
        continue;
      }

      const depth = Math.max(1, Math.round((maxRadius + 0.8 - dist) * 1.1));
      const bottomY = Math.max(4, surfaceY - depth + 1);

      const isSandPatch = dx >= 2 && Math.abs(dz) <= 2;
      const isStoneOutcrop = dx <= -3 && dz <= -2;

      for (let y = bottomY; y <= surfaceY; y++) {
        if (y === surfaceY) {
          if (isSandPatch) {
            world.setBlock(x, y, z, BLOCK_TYPES.SAND);
          } else if (isStoneOutcrop) {
            world.setBlock(x, y, z, BLOCK_TYPES.STONE);
          } else {
            world.setBlock(x, y, z, BLOCK_TYPES.GRASS);
          }
        } else if (y >= surfaceY - 2) {
          if (isSandPatch) {
            world.setBlock(x, y, z, BLOCK_TYPES.SAND);
          } else {
            world.setBlock(x, y, z, BLOCK_TYPES.DIRT);
          }
        } else {
          world.setBlock(x, y, z, BLOCK_TYPES.STONE);
        }
      }
    }
  }

  const minX = 13;
  const maxX = 17;
  const minZ = 14;
  const maxZ = 18;

  for (const x of [minX, maxX]) {
    for (const z of [minZ, maxZ]) {
      for (let y = 13; y <= 15; y++) {
        world.setBlock(x, y, z, BLOCK_TYPES.LOG);
      }
    }
  }

  for (let x = minX + 1; x <= maxX - 1; x++) {
    for (let y = 13; y <= 15; y++) {
      world.setBlock(x, y, minZ, BLOCK_TYPES.BRICK);
      world.setBlock(x, y, maxZ, BLOCK_TYPES.BRICK);
    }
  }

  for (let z = minZ + 1; z <= maxZ - 1; z++) {
    for (let y = 13; y <= 15; y++) {
      world.setBlock(maxX, y, z, BLOCK_TYPES.BRICK);
    }
  }

  for (let z = minZ + 1; z <= maxZ - 1; z++) {
    if (z === 16) {
      world.setBlock(minX, 15, z, BLOCK_TYPES.BRICK);
    } else {
      for (let y = 13; y <= 15; y++) {
        world.setBlock(minX, y, z, BLOCK_TYPES.BRICK);
      }
    }
  }

  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      world.setBlock(x, 16, z, BLOCK_TYPES.PLANKS);
    }
  }
}
