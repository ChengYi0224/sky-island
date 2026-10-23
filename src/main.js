import { World, generateIsland } from './logic/world.js';
import { Player } from './logic/player.js';
import { WorldScene } from './render/scene.js';

const SPAWN_POS = { x: 16.5, y: 13, z: 16.5 };

function initGame() {
  const container = document.getElementById('game-container');
  const promptOverlay = document.getElementById('prompt-overlay');

  const world = new World();
  generateIsland(world);

  const player = new Player(world, {
    x: SPAWN_POS.x,
    y: SPAWN_POS.y,
    z: SPAWN_POS.z,
    yaw: 0,
    pitch: -0.2,
  });

  const worldScene = new WorldScene(container, world);

  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  };

  function setKeyState(code, pressed) {
    switch (code) {
      case 'KeyW':
        keys.w = pressed;
        break;
      case 'KeyA':
        keys.a = pressed;
        break;
      case 'KeyS':
        keys.s = pressed;
        break;
      case 'KeyD':
        keys.d = pressed;
        break;
      case 'Space':
        keys.space = pressed;
        break;
    }
  }

  window.addEventListener('keydown', (e) => {
    setKeyState(e.code, true);
  });

  window.addEventListener('keyup', (e) => {
    setKeyState(e.code, false);
  });

  window.addEventListener('blur', () => {
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    keys.space = false;
  });

  const canvas = worldScene.renderer.domElement;

  document.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    if (promptOverlay) {
      promptOverlay.style.display = locked ? 'none' : 'flex';
    }
    if (!locked) {
      keys.w = false;
      keys.a = false;
      keys.s = false;
      keys.d = false;
      keys.space = false;
    }
  });

  const MOUSE_SENSITIVITY = 0.0022;
  const MAX_PITCH = Math.PI / 2 - 0.01;

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return;
    player.yaw -= e.movementX * MOUSE_SENSITIVITY;
    player.pitch = Math.max(
      -MAX_PITCH,
      Math.min(MAX_PITCH, player.pitch - e.movementY * MOUSE_SENSITIVITY)
    );
  });

  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const rawDt = (now - lastTime) / 1000;
    lastTime = now;
    const dt = Math.min(rawDt, 0.05);

    player.update(dt, keys);

    if (player.y < -10) {
      player.x = SPAWN_POS.x;
      player.y = SPAWN_POS.y;
      player.z = SPAWN_POS.z;
      player.vx = 0;
      player.vy = 0;
      player.vz = 0;
    }

    worldScene.updateCamera(player);
    worldScene.render();
  }

  requestAnimationFrame(animate);
}

window.addEventListener('DOMContentLoaded', initGame);
