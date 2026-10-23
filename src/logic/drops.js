export const DROP_ROTATION_SPEED = 2.0;
export const DROP_GRAVITY = 20.0;
export const DROP_INITIAL_VY = 3.0;

export class DropEntity {
  constructor(x, y, z, type) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.type = type;
    this.vy = DROP_INITIAL_VY;
    this.rotation = 0;
    this.onGround = false;
  }
}

export class DropManager {
  constructor(world) {
    this.world = world;
    this.drops = [];
    this.gravity = DROP_GRAVITY;
  }

  spawn(x, y, z, type) {
    if (typeof x === 'object' && x !== null) {
      type = y;
      z = x.z;
      y = x.y;
      x = x.x;
    }
    const posX = Number.isInteger(x) ? x + 0.5 : x;
    const posY = Number.isInteger(y) ? y + 0.5 : y;
    const posZ = Number.isInteger(z) ? z + 0.5 : z;

    const drop = new DropEntity(posX, posY, posZ, type);
    this.drops.push(drop);
    return drop;
  }

  remove(drop) {
    const index = this.drops.indexOf(drop);
    if (index !== -1) {
      this.drops.splice(index, 1);
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }

    for (const drop of this.drops) {
      drop.rotation += DROP_ROTATION_SPEED * dt;

      // Check if a grounded drop has lost its supporting block
      if (drop.onGround) {
        const bx = Math.floor(drop.x);
        const by = Math.floor(drop.y - 0.01);
        const bz = Math.floor(drop.z);
        if (!this.world.isSolid(bx, by, bz)) {
          drop.onGround = false;
        }
      }

      if (!drop.onGround) {
        drop.vy -= this.gravity * dt;
        const nextY = drop.y + drop.vy * dt;

        if (drop.vy <= 0) {
          const bx = Math.floor(drop.x);
          const bz = Math.floor(drop.z);
          const startY = Math.floor(drop.y);
          const endY = Math.floor(nextY);
          let landed = false;

          for (let cy = startY; cy >= endY; cy--) {
            if (this.world.isSolid(bx, cy, bz)) {
              const surfaceY = cy + 1;
              if (surfaceY <= drop.y + 1e-5 && nextY <= surfaceY) {
                drop.y = surfaceY;
                drop.vy = 0;
                drop.onGround = true;
                landed = true;
                break;
              }
            }
          }

          if (!landed) {
            drop.y = nextY;
          }
        } else {
          // Upward motion: check ceiling
          const bx = Math.floor(drop.x);
          const bz = Math.floor(drop.z);
          const startY = Math.floor(drop.y);
          const endY = Math.floor(nextY);
          let hitCeiling = false;

          for (let cy = startY + 1; cy <= endY; cy++) {
            if (this.world.isSolid(bx, cy, bz)) {
              drop.y = cy - 1e-4;
              drop.vy = 0;
              hitCeiling = true;
              break;
            }
          }

          if (!hitCeiling) {
            drop.y = nextY;
          }
        }
      }
    }
  }
}
