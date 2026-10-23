export const PICKUP_DISTANCE = 3.0;

export class Inventory {
  constructor(slotCount = 9) {
    this.slotCount = slotCount;
    this.selectedIndex = 0;
    this.slots = Array.from({ length: slotCount }, () => ({
      type: null,
      count: 0,
    }));
  }

  addItem(type, count = 1) {
    if (!type || count <= 0) {
      return 0;
    }

    // Stack into existing slot of the same type
    let targetSlot = this.slots.find(
      (slot) => slot.type === type && slot.count > 0
    );

    // If not found, use the first empty slot
    if (!targetSlot) {
      targetSlot = this.slots.find(
        (slot) => slot.count === 0 || slot.type === null
      );
    }

    if (targetSlot) {
      targetSlot.type = type;
      targetSlot.count += count;
      return count;
    }

    return 0;
  }

  removeItem(type, count = 1) {
    if (!type || count <= 0) {
      return 0;
    }

    let remaining = count;
    for (const slot of this.slots) {
      if (slot.type === type && slot.count > 0) {
        const take = Math.min(slot.count, remaining);
        slot.count -= take;
        remaining -= take;
        if (slot.count === 0) {
          slot.type = null;
        }
        if (remaining <= 0) {
          break;
        }
      }
    }
    return count - remaining;
  }

  getItemCount(type) {
    let total = 0;
    for (const slot of this.slots) {
      if (slot.type === type) {
        total += slot.count;
      }
    }
    return total;
  }

  getSlot(index) {
    if (index < 0 || index >= this.slots.length) {
      return null;
    }
    return this.slots[index];
  }

  getSelectedSlot() {
    return this.slots[this.selectedIndex] || null;
  }

  selectSlot(index) {
    if (index >= 0 && index < this.slots.length) {
      this.selectedIndex = index;
    }
  }

  scrollSlot(delta) {
    if (!Number.isFinite(delta) || delta === 0) {
      return;
    }
    this.selectedIndex =
      (((this.selectedIndex + delta) % this.slotCount) + this.slotCount) %
      this.slotCount;
  }

  placeBlock(world, player, targetBlock, normal) {
    if (!world || !targetBlock || !normal) {
      return false;
    }

    if (player && player.dead) {
      return false;
    }

    const slot = this.getSelectedSlot();
    if (!slot || slot.count <= 0 || !slot.type) {
      return false;
    }

    if (player) {
      const dist = Math.hypot(
        targetBlock.x - player.x,
        targetBlock.y - player.y,
        targetBlock.z - player.z
      );
      if (dist > 4.0) {
        return false;
      }
    }

    const placeX = Math.round(targetBlock.x + normal.x);
    const placeY = Math.round(targetBlock.y + normal.y);
    const placeZ = Math.round(targetBlock.z + normal.z);

    if (!world.canPlaceBlock(placeX, placeY, placeZ, player)) {
      return false;
    }

    const placed = world.setBlock(placeX, placeY, placeZ, slot.type);
    if (!placed) {
      return false;
    }

    slot.count -= 1;
    if (slot.count === 0) {
      slot.type = null;
    }

    return true;
  }
}
