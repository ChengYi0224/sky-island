import { BLOCK_TYPES } from './world.js';

export const MAX_HEALTH = 20;
export const SUFFOCATION_INTERVAL = 0.5;
export const SUFFOCATION_DAMAGE = 1;

export class HealthSystem {
  constructor(player, world, options = {}) {
    this.player = player;
    this.world = world;
    this.maxHealth = options.maxHealth ?? MAX_HEALTH;
    this.health = options.health ?? this.maxHealth;
    this.suffocationTimer = 0;

    if (this.player) {
      this.player.maxHealth = this.maxHealth;
      this.player.health = this.health;
    }
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
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    this.health = Math.max(0, this.health - amount);
    if (this.player) {
      this.player.health = this.health;
    }
  }

  heal(amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.player) {
      this.player.health = this.health;
    }
  }

  reset() {
    this.health = this.maxHealth;
    this.suffocationTimer = 0;
    if (this.player) {
      this.player.health = this.health;
    }
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) {
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
    }
  }
}
