import { BLOCK_TYPES } from './world.js';

export const SAND_GRAVITY = 20;
export const SAND_MAX_SPEED = 16;

export class SandEntity {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.fallSpeed = 0;
    this.vy = 0;
  }
}

export class SandManager {
  constructor(world) {
    this.world = world;
    this.entities = [];
    this.onSandLanded = null;
  }

  spawn(x, y, z) {
    const entity = new SandEntity(x, y, z);
    this.entities.push(entity);
    return entity;
  }

  triggerFall(x, y, z) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const iz = Math.round(z);

    if (this.world.getBlock(ix, iy, iz) !== BLOCK_TYPES.SAND) {
      return false;
    }

    let bottomY = iy;
    while (bottomY > 0 && this.world.getBlock(ix, bottomY - 1, iz) === BLOCK_TYPES.SAND) {
      bottomY--;
    }

    if (this.world.isSolid(ix, bottomY - 1, iz)) {
      return false;
    }

    let currY = bottomY;
    let triggered = false;
    while (currY < this.world.height && this.world.getBlock(ix, currY, iz) === BLOCK_TYPES.SAND) {
      this.world.setBlock(ix, currY, iz, BLOCK_TYPES.AIR);
      this.spawn(ix, currY, iz);
      triggered = true;
      currY++;
    }

    return triggered;
  }

  checkAndTrigger(x, y, z) {
    return this.triggerFall(x, y, z);
  }

  checkBlock(x, y, z) {
    return this.triggerFall(x, y, z);
  }

  onBlockBreak(x, y, z) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const iz = Math.round(z);
    return this.triggerFall(ix, iy + 1, iz);
  }

  update(dt) {
    if (dt <= 0 || this.entities.length === 0) {
      return { landed: false, landedCount: 0 };
    }

    let landedCount = 0;
    const sorted = [...this.entities].sort((a, b) => a.y - b.y);
    const toRemove = new Set();

    for (const entity of sorted) {
      if (toRemove.has(entity)) {
        continue;
      }

      entity.fallSpeed = Math.min(entity.fallSpeed + SAND_GRAVITY * dt, SAND_MAX_SPEED);
      entity.vy = -entity.fallSpeed;

      const bx = Math.round(entity.x);
      const bz = Math.round(entity.z);

      let landingY = -Infinity;
      const startCheckY = Math.floor(entity.y - 0.0001);
      for (let cy = startCheckY; cy >= 0; cy--) {
        if (this.world.isSolid(bx, cy, bz)) {
          landingY = cy + 1;
          break;
        }
      }

      const nextY = entity.y - entity.fallSpeed * dt;

      if (nextY <= landingY) {
        toRemove.add(entity);
        if (landingY >= 0 && landingY < this.world.height) {
          this.world.setBlock(bx, landingY, bz, BLOCK_TYPES.SAND);
          landedCount++;
          if (typeof this.onSandLanded === 'function') {
            this.onSandLanded(bx, landingY, bz);
          }
        }
      } else if (nextY < -10) {
        toRemove.add(entity);
      } else {
        entity.y = nextY;
      }
    }

    if (toRemove.size > 0) {
      this.entities = this.entities.filter((e) => !toRemove.has(e));
    }

    return {
      landed: landedCount > 0,
      landedCount,
    };
  }
}
