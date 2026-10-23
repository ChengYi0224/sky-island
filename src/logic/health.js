import { BLOCK_TYPES, SPAWN_POINT } from './world.js';

export const MAX_HEALTH = 20;
export const SUFFOCATION_INTERVAL = 0.5;
export const SUFFOCATION_DAMAGE = 1;

export class HealthSystem {
  constructor(player, world, options = {}) {
    this.player = player;
    this.world = world;
    this.options = options;
    this.maxHealth = options.maxHealth ?? MAX_HEALTH;
    this.health = options.health ?? this.maxHealth;
    this.suffocationTimer = 0;
    this.spawn = options.spawn ?? SPAWN_POINT;
    this.onDamage = options.onDamage ?? null;
    this.time = 0;
    this.damageCount = 0;
    this.lastDamageTime = null;

    if (this.player) {
      this.player.maxHealth = this.maxHealth;
      this.player.health = this.health;
      this.player.dead = this.isDead();
    }
  }

  isDead() {
    return this.health <= 0;
  }

  isSuffocating() {
    if (!this.player || !this.world) {
      return false;
    }

    const eyeOffset = this.player.eyeHeight ?? 1.6;
    const hx = Math.floor(this.player.x);
    const hy = Math.floor(this.player.y + eyeOffset);
    const hz = Math.floor(this.player.z);

    const isSand = this.world.getBlock(hx, hy, hz) === BLOCK_TYPES.SAND;
    if (!isSand) {
      this.suffocationTimer = 0;
    }
    return isSand;
  }

  takeDamage(amount) {
    if (this.isDead()) {
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const actualDamage = Math.min(this.health, amount);
    if (actualDamage <= 0) {
      return;
    }

    this.health = Math.max(0, this.health - actualDamage);
    this.damageCount += 1;
    this.lastDamageTime = this.time;

    if (this.player) {
      this.player.health = this.health;
      this.player.dead = this.isDead();
    }

    if (typeof this.onDamage === 'function') {
      this.onDamage(actualDamage);
    }
  }

  heal(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.player) {
      this.player.health = this.health;
      this.player.dead = this.isDead();
    }
  }

  reset() {
    this.health = this.maxHealth;
    this.suffocationTimer = 0;
    if (this.player) {
      this.player.health = this.health;
      this.player.dead = false;
    }
  }

  respawn() {
    this.health = this.maxHealth;
    this.suffocationTimer = 0;
    if (this.player) {
      const spawn = this.spawn;
      this.player.x = spawn.x;
      this.player.y = spawn.y;
      this.player.z = spawn.z;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.vz = 0;
      this.player.dead = false;
      this.player.health = this.maxHealth;
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) {
      return;
    }

    this.time += dt;

    if (this.isDead()) {
      return;
    }

    if (!this.isSuffocating()) {
      this.suffocationTimer = 0;
      return;
    }

    this.suffocationTimer += dt;
    while (this.suffocationTimer >= SUFFOCATION_INTERVAL - 1e-9) {
      this.suffocationTimer = Math.max(0, this.suffocationTimer - SUFFOCATION_INTERVAL);
      this.takeDamage(SUFFOCATION_DAMAGE);
      if (this.isDead()) {
        break;
      }
    }
  }
}
