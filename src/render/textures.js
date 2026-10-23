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

import crack0Url from '../../assets/textures/16px/destroy_stage_0.png';
import crack1Url from '../../assets/textures/16px/destroy_stage_1.png';
import crack2Url from '../../assets/textures/16px/destroy_stage_2.png';
import crack3Url from '../../assets/textures/16px/destroy_stage_3.png';
import crack4Url from '../../assets/textures/16px/destroy_stage_4.png';
import crack5Url from '../../assets/textures/16px/destroy_stage_5.png';
import crack6Url from '../../assets/textures/16px/destroy_stage_6.png';
import crack7Url from '../../assets/textures/16px/destroy_stage_7.png';
import crack8Url from '../../assets/textures/16px/destroy_stage_8.png';
import crack9Url from '../../assets/textures/16px/destroy_stage_9.png';

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

export function createCrackMaterials() {
  const crackUrls = [
    crack0Url,
    crack1Url,
    crack2Url,
    crack3Url,
    crack4Url,
    crack5Url,
    crack6Url,
    crack7Url,
    crack8Url,
    crack9Url,
  ];

  return crackUrls.map((url) => {
    const texture = createPixelTexture(url);
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  });
}
