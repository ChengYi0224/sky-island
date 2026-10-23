import * as THREE from 'three';
import { BLOCK_TYPES } from '../logic/world.js';

import grassTopUrl from '../../assets/textures/16px/grass_top.png';
import grassSideUrl from '../../assets/textures/16px/grass_side.png';
import dirtUrl from '../../assets/textures/16px/dirt.png';
import stoneUrl from '../../assets/textures/16px/stone.png';
import sandUrl from '../../assets/textures/16px/sand.png';
import logSideUrl from '../../assets/textures/16px/log_side.png';
import logTopUrl from '../../assets/textures/16px/log_top.png';
import leavesUrl from '../../assets/textures/16px/leaves.png';
import planksUrl from '../../assets/textures/16px/planks.png';
import brickUrl from '../../assets/textures/16px/brick.png';

function createPixelTexture(dataUrl) {
  const image = new Image();
  const texture = new THREE.Texture(image);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;

  image.onload = () => {
    texture.needsUpdate = true;
  };
  image.src = dataUrl;
  return texture;
}

export function createMaterials() {
  const textures = {
    grass_top: createPixelTexture(grassTopUrl),
    grass_side: createPixelTexture(grassSideUrl),
    dirt: createPixelTexture(dirtUrl),
    stone: createPixelTexture(stoneUrl),
    sand: createPixelTexture(sandUrl),
    log_side: createPixelTexture(logSideUrl),
    log_top: createPixelTexture(logTopUrl),
    leaves: createPixelTexture(leavesUrl),
    planks: createPixelTexture(planksUrl),
    brick: createPixelTexture(brickUrl),
  };

  const materials = {};
  for (const [key, texture] of Object.entries(textures)) {
    materials[key] = new THREE.MeshLambertMaterial({ map: texture });
  }
  return materials;
}

export function getFaceTextureKey(blockType, faceDir) {
  switch (blockType) {
    case BLOCK_TYPES.GRASS:
      if (faceDir === 'top') return 'grass_top';
      if (faceDir === 'bottom') return 'dirt';
      return 'grass_side';
    case BLOCK_TYPES.DIRT:
      return 'dirt';
    case BLOCK_TYPES.STONE:
      return 'stone';
    case BLOCK_TYPES.SAND:
      return 'sand';
    case BLOCK_TYPES.LOG:
      if (faceDir === 'top' || faceDir === 'bottom') return 'log_top';
      return 'log_side';
    case BLOCK_TYPES.LEAVES:
      return 'leaves';
    case BLOCK_TYPES.PLANKS:
      return 'planks';
    case BLOCK_TYPES.BRICK:
      return 'brick';
    default:
      return 'stone';
  }
}
