import * as THREE from 'three';
import { BLOCK_TYPES } from '../logic/world.js';
import { createMaterials, createCrackMaterials, getFaceTextureKey } from './textures.js';

const FACES = [
  {
    dir: 'right',
    neighbor: [1, 0, 0],
    normal: [1, 0, 0],
    corners: [
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
    ],
  },
  {
    dir: 'left',
    neighbor: [-1, 0, 0],
    normal: [-1, 0, 0],
    corners: [
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 1, 0], uv: [0, 1] },
    ],
  },
  {
    dir: 'top',
    neighbor: [0, 1, 0],
    normal: [0, 1, 0],
    corners: [
      { pos: [0, 1, 1], uv: [0, 0] },
      { pos: [1, 1, 1], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [0, 1, 0], uv: [0, 1] },
    ],
  },
  {
    dir: 'bottom',
    neighbor: [0, -1, 0],
    normal: [0, -1, 0],
    corners: [
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 0] },
      { pos: [1, 0, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [0, 1] },
    ],
  },
  {
    dir: 'front',
    neighbor: [0, 0, 1],
    normal: [0, 0, 1],
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [1, 1, 1], uv: [1, 1] },
      { pos: [0, 1, 1], uv: [0, 1] },
    ],
  },
  {
    dir: 'back',
    neighbor: [0, 0, -1],
    normal: [0, 0, -1],
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [0, 1, 0], uv: [1, 1] },
      { pos: [1, 1, 0], uv: [0, 1] },
    ],
  },
];

export class WorldScene {
  constructor(container, world) {
    this.container = container;
    this.world = world;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbfe0f4);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.rotation.order = 'YXZ';

    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
    dirLight.position.set(24, 40, 18);
    this.scene.add(dirLight);

    this.materials = createMaterials();
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    this.crackMaterials = createCrackMaterials();
    const crackGeom = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    this.crackMesh = new THREE.Mesh(crackGeom, this.crackMaterials[0]);
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);

    this.dropsGroup = new THREE.Group();
    this.scene.add(this.dropsGroup);
    this.dropMeshes = new Map();
    this.dropGeometry = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    this.flyingPickups = [];

    this.raycaster = new THREE.Raycaster();
    this.crosshairCenter = new THREE.Vector2(0, 0);

    this.rebuildWorldMesh();

    window.addEventListener('resize', () => this.onResize());
  }

  getRaycastBlock(maxDistance = 5) {
    this.raycaster.setFromCamera(this.crosshairCenter, this.camera);
    this.raycaster.far = maxDistance;
    const intersects = this.raycaster.intersectObjects(this.worldGroup.children);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const normal = hit.face.normal;
      const bx = Math.floor(hit.point.x - normal.x * 0.01);
      const by = Math.floor(hit.point.y - normal.y * 0.01);
      const bz = Math.floor(hit.point.z - normal.z * 0.01);
      return {
        x: bx,
        y: by,
        z: bz,
        distance: hit.distance,
        normal: { x: normal.x, y: normal.y, z: normal.z },
      };
    }
    return null;
  }

  updateCrack(target, stage) {
    if (!target || stage < 0 || stage > 9) {
      this.hideCrack();
      return;
    }
    this.crackMesh.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
    this.crackMesh.material = this.crackMaterials[stage];
    this.crackMesh.visible = true;
  }

  hideCrack() {
    this.crackMesh.visible = false;
  }

  createDropMesh(type) {
    const faceDirs = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    const mats = faceDirs.map(
      (dir) => this.materials[getFaceTextureKey(type, dir)]
    );
    return new THREE.Mesh(this.dropGeometry, mats);
  }

  updateDrops(drops) {
    const activeDrops = new Set(drops);

    for (const [drop, mesh] of this.dropMeshes.entries()) {
      if (!activeDrops.has(drop)) {
        this.dropsGroup.remove(mesh);
        this.dropMeshes.delete(drop);
      }
    }

    for (const drop of drops) {
      let mesh = this.dropMeshes.get(drop);
      if (!mesh) {
        mesh = this.createDropMesh(drop.type);
        this.dropMeshes.set(drop, mesh);
        this.dropsGroup.add(mesh);
      }
      mesh.position.set(drop.x, drop.y + 0.14, drop.z);
      mesh.rotation.y = drop.rotation;
    }
  }

  triggerPickup(x, y, z, type) {
    const mesh = this.createDropMesh(type);
    mesh.position.set(x, y, z);
    this.dropsGroup.add(mesh);
    this.flyingPickups.push({
      mesh,
      progress: 0,
      startX: x,
      startY: y,
      startZ: z,
    });
  }

  updateFlyingPickups(dt, playerPos) {
    for (let i = this.flyingPickups.length - 1; i >= 0; i--) {
      const item = this.flyingPickups[i];
      item.progress += dt / 0.18;
      const t = Math.min(item.progress, 1);
      const easeT = t * t * (3 - 2 * t);

      const targetY = playerPos.y + 0.8;
      item.mesh.position.x = item.startX + (playerPos.x - item.startX) * easeT;
      item.mesh.position.y = item.startY + (targetY - item.startY) * easeT;
      item.mesh.position.z = item.startZ + (playerPos.z - item.startZ) * easeT;
      item.mesh.rotation.y += 12 * dt;

      const scale = Math.max(0.01, 1 - t * 0.7);
      item.mesh.scale.set(scale, scale, scale);

      if (t >= 1) {
        this.dropsGroup.remove(item.mesh);
        this.flyingPickups.splice(i, 1);
      }
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  rebuildWorldMesh() {
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children.pop();
      if (child.geometry) {
        child.geometry.dispose();
      }
    }

    const buckets = {};

    for (let y = 0; y < this.world.height; y++) {
      for (let z = 0; z < this.world.depth; z++) {
        for (let x = 0; x < this.world.width; x++) {
          const block = this.world.getBlock(x, y, z);
          if (block === BLOCK_TYPES.AIR) continue;

          for (const face of FACES) {
            const nx = x + face.neighbor[0];
            const ny = y + face.neighbor[1];
            const nz = z + face.neighbor[2];
            if (this.world.isSolid(nx, ny, nz)) continue;

            const texKey = getFaceTextureKey(block, face.dir);
            if (!buckets[texKey]) {
              buckets[texKey] = {
                positions: [],
                normals: [],
                uvs: [],
                indices: [],
              };
            }

            const b = buckets[texKey];
            const baseIndex = b.positions.length / 3;

            for (const corner of face.corners) {
              b.positions.push(
                x + corner.pos[0],
                y + corner.pos[1],
                z + corner.pos[2]
              );
              b.normals.push(face.normal[0], face.normal[1], face.normal[2]);
              b.uvs.push(corner.uv[0], corner.uv[1]);
            }

            b.indices.push(
              baseIndex,
              baseIndex + 1,
              baseIndex + 2,
              baseIndex,
              baseIndex + 2,
              baseIndex + 3
            );
          }
        }
      }
    }

    for (const [texKey, b] of Object.entries(buckets)) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(b.positions, 3)
      );
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(b.normals, 3)
      );
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(b.uvs, 2));
      geometry.setIndex(b.indices);

      const mesh = new THREE.Mesh(geometry, this.materials[texKey]);
      this.worldGroup.add(mesh);
    }
  }

  updateCamera(player) {
    this.camera.position.set(player.x, player.y + player.eyeHeight, player.z);
    this.camera.rotation.y = player.yaw;
    this.camera.rotation.x = player.pitch;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
