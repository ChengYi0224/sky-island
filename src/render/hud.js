import { BLOCK_TYPES } from '../logic/world.js';

import grassIcon from '../../assets/icons/grass.png';
import dirtIcon from '../../assets/icons/dirt.png';
import stoneIcon from '../../assets/icons/stone.png';
import sandIcon from '../../assets/icons/sand.png';
import logIcon from '../../assets/icons/log.png';
import leavesIcon from '../../assets/icons/leaves.png';
import planksIcon from '../../assets/icons/planks.png';
import brickIcon from '../../assets/icons/brick.png';

export const ICON_MAP = Object.freeze({
  [BLOCK_TYPES.GRASS]: grassIcon,
  [BLOCK_TYPES.DIRT]: dirtIcon,
  [BLOCK_TYPES.STONE]: stoneIcon,
  [BLOCK_TYPES.SAND]: sandIcon,
  [BLOCK_TYPES.LOG]: logIcon,
  [BLOCK_TYPES.LEAVES]: leavesIcon,
  [BLOCK_TYPES.PLANKS]: planksIcon,
  [BLOCK_TYPES.BRICK]: brickIcon,
});

export class Hud {
  constructor(inventory, healthSystem = null, container = document.body) {
    if (healthSystem && healthSystem.nodeType) {
      container = healthSystem;
      healthSystem = null;
    }
    this.inventory = inventory;
    this.healthSystem = healthSystem;
    this.container = container;
    this.slotElements = [];

    this._createDom();
    this.update();
  }

  setHealthSystem(healthSystem) {
    this.healthSystem = healthSystem;
    this.update();
  }

  _createDom() {
    let healthEl = document.getElementById('health-display');
    if (!healthEl) {
      healthEl = document.createElement('div');
      healthEl.id = 'health-display';
      healthEl.className = 'health-display';
      this.container.appendChild(healthEl);
    }
    this.healthElement = healthEl;

    let hotbar = document.getElementById('hotbar');
    if (!hotbar) {
      hotbar = document.createElement('div');
      hotbar.id = 'hotbar';
      hotbar.className = 'hotbar';
      this.container.appendChild(hotbar);
    }
    hotbar.innerHTML = '';

    for (let i = 0; i < this.inventory.slotCount; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'hotbar-slot';
      slotEl.dataset.index = String(i);

      const iconImg = document.createElement('img');
      iconImg.className = 'hotbar-icon';
      iconImg.alt = '';
      iconImg.style.display = 'none';

      const countSpan = document.createElement('span');
      countSpan.className = 'hotbar-count';

      slotEl.appendChild(iconImg);
      slotEl.appendChild(countSpan);
      hotbar.appendChild(slotEl);

      this.slotElements.push({
        slotEl,
        iconImg,
        countSpan,
      });
    }

    this.hotbarElement = hotbar;
  }

  update() {
    if (this.healthElement) {
      if (this.healthSystem) {
        const current = Math.max(0, Math.round(this.healthSystem.health));
        const max = this.healthSystem.maxHealth ?? 20;
        this.healthElement.textContent = `HP ${current}/${max}`;
      } else {
        this.healthElement.textContent = 'HP 20/20';
      }
    }

    const selectedIdx = this.inventory.selectedIndex ?? 0;

    for (let i = 0; i < this.slotElements.length; i++) {
      const { slotEl, iconImg, countSpan } = this.slotElements[i];
      const slot = this.inventory.getSlot(i);

      if (i === selectedIdx) {
        slotEl.classList.add('selected');
      } else {
        slotEl.classList.remove('selected');
      }

      if (slot && slot.type && slot.count > 0) {
        const iconSrc = ICON_MAP[slot.type] || '';
        iconImg.src = iconSrc;
        iconImg.style.display = iconSrc ? 'block' : 'none';
        countSpan.textContent = String(slot.count);
      } else {
        iconImg.removeAttribute('src');
        iconImg.style.display = 'none';
        countSpan.textContent = '';
      }
    }
  }
}
