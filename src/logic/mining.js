import { BLOCK_TYPES } from './world.js';

export const MAX_MINING_DISTANCE = 4;

export const MINING_TIMES = Object.freeze({
  [BLOCK_TYPES.DIRT]: 0.6,
  [BLOCK_TYPES.GRASS]: 0.6,
  [BLOCK_TYPES.SAND]: 0.6,
  [BLOCK_TYPES.STONE]: 2.0,
  [BLOCK_TYPES.LOG]: 1.5,
  [BLOCK_TYPES.LEAVES]: 0.3,
  [BLOCK_TYPES.PLANKS]: 1.5,
  [BLOCK_TYPES.BRICK]: 2.0,
});

function getDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.hypot(dx, dy, dz);
}

function isSameBlock(a, b) {
  if (!a || !b) return false;
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

export class MiningController {
  constructor(world) {
    this.world = world;
    this.target = null;
    this.progress = 0;
    this.stage = 0;
    this.elapsedTime = 0;
  }

  reset() {
    this.target = null;
    this.progress = 0;
    this.stage = 0;
    this.elapsedTime = 0;
  }

  update(dt, options = {}) {
    const { isMining = false, target = null, playerPos = null } = options;

    if (!isMining || !target || !playerPos) {
      this.reset();
      return { broken: false };
    }

    const distance = getDistance(target, playerPos);
    if (distance > MAX_MINING_DISTANCE) {
      this.reset();
      return { broken: false };
    }

    const blockType = this.world.getBlock(target.x, target.y, target.z);
    if (blockType === BLOCK_TYPES.AIR) {
      this.reset();
      return { broken: false };
    }

    if (!isSameBlock(this.target, target)) {
      this.target = { x: target.x, y: target.y, z: target.z };
      this.progress = 0;
      this.stage = 0;
      this.elapsedTime = 0;
    }

    const duration = MINING_TIMES[blockType] ?? 1.0;
    this.elapsedTime += dt;
    this.progress = Math.min(1.0, this.elapsedTime / duration);
    this.stage = Math.min(9, Math.floor(this.progress * 10));

    if (this.elapsedTime >= duration - 1e-5) {
      const brokenTarget = { ...this.target };
      this.world.setBlock(brokenTarget.x, brokenTarget.y, brokenTarget.z, BLOCK_TYPES.AIR);
      this.reset();
      return {
        broken: true,
        blockType,
        target: brokenTarget,
      };
    }

    return { broken: false };
  }
}
