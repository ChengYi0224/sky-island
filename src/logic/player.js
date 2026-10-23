const EPS = 1e-6;
const TOLERANCE = 1e-4;

export class Player {
  constructor(world, options = {}) {
    this.world = world;
    this.x = options.x ?? 16.5;
    this.y = options.y ?? 13;
    this.z = options.z ?? 16.5;
    this.yaw = options.yaw ?? 0;
    this.pitch = options.pitch ?? 0;

    this.width = options.width ?? 0.6;
    this.height = options.height ?? 1.8;
    this.eyeHeight = options.eyeHeight ?? 1.6;

    this.speed = options.speed ?? 4.5;
    this.jumpSpeed = options.jumpSpeed ?? 8.0;
    this.gravity = options.gravity ?? 25.0;

    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.onGround = false;

    this.maxHealth = options.maxHealth ?? 20;
    this.health = options.health ?? this.maxHealth;
  }

  getBoundingBox(x = this.x, y = this.y, z = this.z) {
    const halfW = this.width / 2;
    return {
      minX: x - halfW,
      maxX: x + halfW,
      minY: y,
      maxY: y + this.height,
      minZ: z - halfW,
      maxZ: z + halfW,
    };
  }

  update(dt, input = {}) {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }

    const forward = (input.w ? 1 : 0) - (input.s ? 1 : 0);
    const strafe = (input.d ? 1 : 0) - (input.a ? 1 : 0);

    if (forward !== 0 || strafe !== 0) {
      const len = Math.hypot(forward, strafe);
      const nf = forward / len;
      const ns = strafe / len;
      const sinY = Math.sin(this.yaw);
      const cosY = Math.cos(this.yaw);

      const dirX = nf * -sinY + ns * cosY;
      const dirZ = nf * -cosY + ns * -sinY;

      this.vx = dirX * this.speed;
      this.vz = dirZ * this.speed;
    } else {
      this.vx = 0;
      this.vz = 0;
    }

    this._moveX(this.vx * dt);
    this._moveZ(this.vz * dt);

    if ((input.space || input.jump) && this.onGround) {
      this.vy = this.jumpSpeed;
      this.onGround = false;
    }

    this.vy -= this.gravity * dt;
    this._moveY(this.vy * dt);
  }

  _moveX(dx) {
    if (dx === 0) return;
    const prevX = this.x;
    this.x += dx;
    const halfW = this.width / 2;
    const minY = Math.floor(this.y + EPS);
    const maxY = Math.floor(this.y + this.height - EPS);
    const minZ = Math.floor(this.z - halfW + EPS);
    const maxZ = Math.floor(this.z + halfW - EPS);
    const minX = Math.floor(this.x - halfW + EPS);
    const maxX = Math.floor(this.x + halfW - EPS);

    if (dx > 0) {
      for (let bx = minX; bx <= maxX; bx++) {
        if (bx < prevX + halfW - TOLERANCE) continue;
        for (let by = minY; by <= maxY; by++) {
          for (let bz = minZ; bz <= maxZ; bz++) {
            if (this.world.isSolid(bx, by, bz)) {
              this.x = bx - halfW;
              this.vx = 0;
              return;
            }
          }
        }
      }
    } else {
      for (let bx = maxX; bx >= minX; bx--) {
        if (bx + 1 > prevX - halfW + TOLERANCE) continue;
        for (let by = minY; by <= maxY; by++) {
          for (let bz = minZ; bz <= maxZ; bz++) {
            if (this.world.isSolid(bx, by, bz)) {
              this.x = bx + 1 + halfW;
              this.vx = 0;
              return;
            }
          }
        }
      }
    }
  }

  _moveZ(dz) {
    if (dz === 0) return;
    const prevZ = this.z;
    this.z += dz;
    const halfW = this.width / 2;
    const minY = Math.floor(this.y + EPS);
    const maxY = Math.floor(this.y + this.height - EPS);
    const minX = Math.floor(this.x - halfW + EPS);
    const maxX = Math.floor(this.x + halfW - EPS);
    const minZ = Math.floor(this.z - halfW + EPS);
    const maxZ = Math.floor(this.z + halfW - EPS);

    if (dz > 0) {
      for (let bz = minZ; bz <= maxZ; bz++) {
        if (bz < prevZ + halfW - TOLERANCE) continue;
        for (let by = minY; by <= maxY; by++) {
          for (let bx = minX; bx <= maxX; bx++) {
            if (this.world.isSolid(bx, by, bz)) {
              this.z = bz - halfW;
              this.vz = 0;
              return;
            }
          }
        }
      }
    } else {
      for (let bz = maxZ; bz >= minZ; bz--) {
        if (bz + 1 > prevZ - halfW + TOLERANCE) continue;
        for (let by = minY; by <= maxY; by++) {
          for (let bx = minX; bx <= maxX; bx++) {
            if (this.world.isSolid(bx, by, bz)) {
              this.z = bz + 1 + halfW;
              this.vz = 0;
              return;
            }
          }
        }
      }
    }
  }

  _moveY(dy) {
    const prevY = this.y;
    this.y += dy;
    this.onGround = false;

    const halfW = this.width / 2;
    const minX = Math.floor(this.x - halfW + EPS);
    const maxX = Math.floor(this.x + halfW - EPS);
    const minZ = Math.floor(this.z - halfW + EPS);
    const maxZ = Math.floor(this.z + halfW - EPS);
    const minY = Math.floor(this.y + EPS);
    const maxY = Math.floor(this.y + this.height - EPS);

    if (dy <= 0) {
      for (let by = maxY; by >= minY; by--) {
        if (by + 1 > prevY + TOLERANCE) continue;
        for (let bx = minX; bx <= maxX; bx++) {
          for (let bz = minZ; bz <= maxZ; bz++) {
            if (this.world.isSolid(bx, by, bz)) {
              this.y = by + 1;
              this.vy = 0;
              this.onGround = true;
              return;
            }
          }
        }
      }
    } else {
      for (let by = minY; by <= maxY; by++) {
        if (by < prevY + this.height - TOLERANCE) continue;
        for (let bx = minX; bx <= maxX; bx++) {
          for (let bz = minZ; bz <= maxZ; bz++) {
            if (this.world.isSolid(bx, by, bz)) {
              this.y = by - this.height;
              this.vy = 0;
              return;
            }
          }
        }
      }
    }
  }
}
