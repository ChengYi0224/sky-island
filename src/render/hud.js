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
  constructor(inventory, container = document.body) {
    this.inventory = inventory;
    this.container = container;
    this.slotElements = [];

    this._createDom();
    this.update();
  }

  _createDom() {
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
