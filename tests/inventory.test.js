import { describe, it, expect, beforeEach } from 'vitest';
import { World, BLOCK_TYPES } from '../src/logic/world.js';
import { Player } from '../src/logic/player.js';
import { DropManager } from '../src/logic/drops.js';
import { Inventory, PICKUP_DISTANCE } from '../src/logic/inventory.js';
import { MiningController } from '../src/logic/mining.js';

describe('STEP 3: 快捷欄與背包資料結構 (inventory.js)', () => {
  it('建立快捷欄資料結構，預設有固定格數且初始數量為 0', () => {
    const inventory = new Inventory(9);

    expect(inventory.slots).toBeDefined();
    expect(inventory.slots.length).toBe(9);
    expect(inventory.slots.every((slot) => slot.count === 0)).toBe(true);
  });

  it('快捷欄加入物品時，同種類堆疊累積數量', () => {
    const inventory = new Inventory(9);

    inventory.addItem(BLOCK_TYPES.DIRT, 1);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);

    inventory.addItem(BLOCK_TYPES.DIRT, 2);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(3);
  });

  it('畫面上看得到快捷欄：不同種類方塊（泥土、石頭、沙子）加入時分別加進對應種類格子數字', () => {
    const inventory = new Inventory(9);

    inventory.addItem(BLOCK_TYPES.DIRT, 1);
    inventory.addItem(BLOCK_TYPES.STONE, 3);
    inventory.addItem(BLOCK_TYPES.SAND, 5);

    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);
    expect(inventory.getItemCount(BLOCK_TYPES.STONE)).toBe(3);
    expect(inventory.getItemCount(BLOCK_TYPES.SAND)).toBe(5);
  });
});

describe('STEP 3: 掉落物撿取邏輯與 3 格距離判定 (drops.js + inventory.js)', () => {
  let world;
  let player;
  let dropManager;
  let inventory;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 10.0, z: 10.5 });
    dropManager = new DropManager(world);
    inventory = new Inventory(9);
  });

  it('走到旁邊：距離 3 格以內（2.9 格）掉落物飛到身上被撿起，那一格數字 +1 且掉落物從小島移除', () => {
    // 掉落物座標與玩家距離為 2.9 格 (< 3 格)
    const drop = dropManager.spawn(10.5 + 2.9, 10.0, 10.5, BLOCK_TYPES.DIRT);

    expect(dropManager.drops).toContain(drop);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(0);

    dropManager.update(0.05, player, inventory);

    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);
    expect(dropManager.drops).not.toContain(drop);
  });

  it('不可以：站在 3 格外（3.1 格）也被撿起來', () => {
    // 掉落物座標與玩家距離為 3.1 格 (> 3 格)
    const drop = dropManager.spawn(10.5 + 3.1, 10.0, 10.5, BLOCK_TYPES.STONE);

    expect(dropManager.drops).toContain(drop);

    dropManager.update(0.05, player, inventory);

    expect(inventory.getItemCount(BLOCK_TYPES.STONE)).toBe(0);
    expect(dropManager.drops).toContain(drop);
  });

  it('邊界精確測試：距離 3.0 格內可撿取，超過 3.0 格不可撿取', () => {
    expect(PICKUP_DISTANCE).toBe(3.0);

    const dropAtBoundary = dropManager.spawn(10.5 + 3.0, 10.0, 10.5, BLOCK_TYPES.SAND);
    const dropBeyondBoundary = dropManager.spawn(10.5 + 3.05, 10.0, 10.5, BLOCK_TYPES.GRASS);

    dropManager.update(0.05, player, inventory);

    // 剛好在 3.0 格內被撿起
    expect(inventory.getItemCount(BLOCK_TYPES.SAND)).toBe(1);
    expect(dropManager.drops).not.toContain(dropAtBoundary);

    // 超過 3.0 格（3.05 格）不被撿起
    expect(inventory.getItemCount(BLOCK_TYPES.GRASS)).toBe(0);
    expect(dropManager.drops).toContain(dropBeyondBoundary);
  });

  it('連續撿起不同種類的小方塊（泥土、石頭），快捷欄分別累積對應數字', () => {
    dropManager.spawn(10.5 + 1.0, 10.0, 10.5, BLOCK_TYPES.DIRT);
    dropManager.spawn(10.5, 10.0, 10.5 + 1.5, BLOCK_TYPES.DIRT);
    dropManager.spawn(10.5 - 2.0, 10.0, 10.5, BLOCK_TYPES.STONE);
    const farSand = dropManager.spawn(10.5 + 5.0, 10.0, 10.5, BLOCK_TYPES.SAND);

    dropManager.update(0.05, player, inventory);

    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(2);
    expect(inventory.getItemCount(BLOCK_TYPES.STONE)).toBe(1);
    expect(inventory.getItemCount(BLOCK_TYPES.SAND)).toBe(0);
    expect(dropManager.drops.length).toBe(1);
    expect(dropManager.drops).toContain(farSand);
  });
});

describe('STEP 4: 快捷欄切換與選中格子 (inventory.js)', () => {
  let inventory;

  beforeEach(() => {
    inventory = new Inventory(9);
  });

  it('以數字鍵切換快捷欄選中格子（selectSlot），超出有效範圍則忽略', () => {
    expect(inventory.selectedIndex).toBe(0);

    inventory.selectSlot(3);
    expect(inventory.selectedIndex).toBe(3);
    expect(inventory.getSelectedSlot()).toBe(inventory.slots[3]);

    inventory.selectSlot(8);
    expect(inventory.selectedIndex).toBe(8);

    // 超出範圍無效，維持原狀
    inventory.selectSlot(-1);
    expect(inventory.selectedIndex).toBe(8);

    inventory.selectSlot(9);
    expect(inventory.selectedIndex).toBe(8);
  });

  it('以滑鼠滾輪切換快捷欄選中格子（scrollSlot），支援正向、負向與循環切換（wrap-around）', () => {
    expect(inventory.selectedIndex).toBe(0);

    // 正向滾動 1 格
    inventory.scrollSlot(1);
    expect(inventory.selectedIndex).toBe(1);

    // 負向滾動 1 格回到 0
    inventory.scrollSlot(-1);
    expect(inventory.selectedIndex).toBe(0);

    // 0 負向滾動 1 格應循環至最後一格 (8)
    inventory.scrollSlot(-1);
    expect(inventory.selectedIndex).toBe(8);

    // 8 正向滾動 1 格應循環回到第一格 (0)
    inventory.scrollSlot(1);
    expect(inventory.selectedIndex).toBe(0);

    // 滾動多格
    inventory.scrollSlot(3);
    expect(inventory.selectedIndex).toBe(3);
  });
});

describe('STEP 4: 世界邊界與玩家碰撞箱放置條件判定 (world.js canPlaceBlock)', () => {
  let world;
  let player;

  beforeEach(() => {
    world = new World();
    player = new Player(world, { x: 10.5, y: 10.0, z: 10.5, width: 0.6, height: 1.8 });
  });

  it('世界邊界檢查：超出 32×32×32 邊界（< 0 或 >= 32）禁止放置方塊', () => {
    // 邊界內合法位置
    expect(world.canPlaceBlock(0, 0, 0, player)).toBe(true);
    expect(world.canPlaceBlock(31, 31, 31, player)).toBe(true);

    // X 超出邊界
    expect(world.canPlaceBlock(-1, 10, 10, player)).toBe(false);
    expect(world.canPlaceBlock(32, 10, 10, player)).toBe(false);

    // Y 超出邊界（天花板與世界底）
    expect(world.canPlaceBlock(10, -1, 10, player)).toBe(false);
    expect(world.canPlaceBlock(10, 32, 10, player)).toBe(false);

    // Z 超出邊界
    expect(world.canPlaceBlock(10, 10, -1, player)).toBe(false);
    expect(world.canPlaceBlock(10, 10, 32, player)).toBe(false);
  });

  it('不可覆蓋既有方塊：目標位置若已有非 AIR 方塊禁止放置', () => {
    world.setBlock(15, 10, 15, BLOCK_TYPES.STONE);
    expect(world.canPlaceBlock(15, 10, 15, player)).toBe(false);
  });

  it('玩家碰撞箱檢查：方塊若與玩家自身 AABB 碰撞箱重疊（腳部與頭部），禁止放置', () => {
    // 玩家在 (10.5, 10.0, 10.5)，寬 0.6，高 1.8
    // X: [10.2, 10.8], Y: [10.0, 11.8], Z: [10.2, 10.8]

    // 腳部所在格子 (10, 10, 10)：完全重疊
    expect(world.canPlaceBlock(10, 10, 10, player)).toBe(false);

    // 頭部所在格子 (10, 11, 10)：Y 跨越 10.0~11.8，重疊
    expect(world.canPlaceBlock(10, 11, 10, player)).toBe(false);

    // 頭頂上方格子 (10, 12, 10)：Y 在 [12, 13]，不重疊
    expect(world.canPlaceBlock(10, 12, 10, player)).toBe(true);

    // 腳下正下方格子 (10, 9, 10)：Y 在 [9, 10]，頂面剛好接觸但不相交體積
    expect(world.canPlaceBlock(10, 9, 10, player)).toBe(true);

    // 玩家身旁相鄰格子 (11, 10, 10)：X 在 [11, 12]，不重疊
    expect(world.canPlaceBlock(11, 10, 10, player)).toBe(true);
  });

  it('玩家跨越兩格邊界時：只要與玩家碰撞箱有任何交集即禁止放置', () => {
    // 將玩家移至邊界處 (10.9, 10.0, 10.5)，X 範圍 [10.6, 11.2]
    player.x = 10.9;
    // (10, 10, 10) 與 (11, 10, 10) 皆與玩家相交
    expect(world.canPlaceBlock(10, 10, 10, player)).toBe(false);
    expect(world.canPlaceBlock(11, 10, 10, player)).toBe(false);

    // (12, 10, 10) 則不相交
    expect(world.canPlaceBlock(12, 10, 10, player)).toBe(true);
  });
});

describe('STEP 4: 右鍵放置方塊與完整循環 (inventory.js placeBlock + 流程驗證)', () => {
  let world;
  let player;
  let inventory;
  let mining;
  let dropManager;

  beforeEach(() => {
    world = new World();
    // 玩家站在 (10.5, 10.0, 8.5)
    player = new Player(world, { x: 10.5, y: 10.0, z: 8.5 });
    inventory = new Inventory(9);
    mining = new MiningController(world);
    dropManager = new DropManager(world);
  });

  it('選那一格按右鍵：對準目標方塊表面（距離 4 格內）放出一格，數字 −1 且世界新增方塊', () => {
    // 建立一個地基方塊 (10, 9, 10)
    world.setBlock(10, 9, 10, BLOCK_TYPES.STONE);

    // 快捷欄選中格加入 3 個泥土
    inventory.addItem(BLOCK_TYPES.DIRT, 3);
    inventory.selectSlot(0);
    expect(inventory.getSelectedSlot().count).toBe(3);

    // 對準 (10, 9, 10) 的上表面 normal (0, 1, 0) 按右鍵放置 -> 目標放置於 (10, 10, 10)
    const success = inventory.placeBlock(world, player, { x: 10, y: 9, z: 10 }, { x: 0, y: 1, z: 0 });

    expect(success).toBe(true);
    expect(world.getBlock(10, 10, 10)).toBe(BLOCK_TYPES.DIRT);
    expect(inventory.getSelectedSlot().count).toBe(2);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(2);
  });

  it('不可以：數字是 0 還放得出來（數量為 0 時放置失敗，不放置且不扣數量）', () => {
    world.setBlock(10, 9, 10, BLOCK_TYPES.STONE);
    inventory.selectSlot(0);
    expect(inventory.getSelectedSlot().count).toBe(0);

    const success = inventory.placeBlock(world, player, { x: 10, y: 9, z: 10 }, { x: 0, y: 1, z: 0 });

    expect(success).toBe(false);
    expect(world.getBlock(10, 10, 10)).toBe(BLOCK_TYPES.AIR);
    expect(inventory.getSelectedSlot().count).toBe(0);
  });

  it('連續放置至數量歸零：最後一格放完後 slot 清空，後續再放會被阻擋', () => {
    world.setBlock(10, 9, 10, BLOCK_TYPES.STONE);
    inventory.addItem(BLOCK_TYPES.SAND, 1);
    inventory.selectSlot(0);

    // 第一次放置：剩餘 1 放出，成功且數量歸 0
    const firstPlace = inventory.placeBlock(world, player, { x: 10, y: 9, z: 10 }, { x: 0, y: 1, z: 0 });
    expect(firstPlace).toBe(true);
    expect(world.getBlock(10, 10, 10)).toBe(BLOCK_TYPES.SAND);
    expect(inventory.getSelectedSlot().count).toBe(0);

    // 第二次放置：數量為 0，失敗
    const secondPlace = inventory.placeBlock(world, player, { x: 10, y: 10, z: 10 }, { x: 0, y: 1, z: 0 });
    expect(secondPlace).toBe(false);
    expect(world.getBlock(10, 11, 10)).toBe(BLOCK_TYPES.AIR);
  });

  it('不可以：隔太遠放置方塊（距離超過 4 格以外按右鍵禁止放置）', () => {
    // 目標方塊在 (10, 9, 15)，距離玩家 (10.5, 10.0, 8.5) 約 6.5 格 (> 4 格)
    world.setBlock(10, 9, 15, BLOCK_TYPES.STONE);
    inventory.addItem(BLOCK_TYPES.DIRT, 2);
    inventory.selectSlot(0);

    const success = inventory.placeBlock(world, player, { x: 10, y: 9, z: 15 }, { x: 0, y: 1, z: 0 });

    expect(success).toBe(false);
    expect(world.getBlock(10, 10, 15)).toBe(BLOCK_TYPES.AIR);
    expect(inventory.getSelectedSlot().count).toBe(2);
  });

  it('不可以：放置座標與玩家碰撞箱重疊或超出世界邊界時禁止放置', () => {
    // 玩家站在 (10.5, 10.0, 8.5)
    // 1. 嘗試放在玩家自身位置 (10, 10, 8)
    world.setBlock(10, 9, 8, BLOCK_TYPES.STONE);
    inventory.addItem(BLOCK_TYPES.STONE, 3);
    inventory.selectSlot(0);

    const hitPlayer = inventory.placeBlock(world, player, { x: 10, y: 9, z: 8 }, { x: 0, y: 1, z: 0 });
    expect(hitPlayer).toBe(false);
    expect(world.getBlock(10, 10, 8)).toBe(BLOCK_TYPES.AIR);
    expect(inventory.getSelectedSlot().count).toBe(3);

    // 2. 嘗試超出邊界放置（例如 Y >= 32）
    world.setBlock(10, 31, 10, BLOCK_TYPES.STONE);
    const outOfBounds = inventory.placeBlock(world, player, { x: 10, y: 31, z: 10 }, { x: 0, y: 1, z: 0 });
    expect(outOfBounds).toBe(false);
    expect(inventory.getSelectedSlot().count).toBe(3);
  });

  it('整串走一遍：『挖 → 掉 → 撿 → 放』完整循環回到原本數字', () => {
    // 初始設定：快捷欄已有 1 個泥土
    inventory.addItem(BLOCK_TYPES.DIRT, 1);
    inventory.selectSlot(0);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);

    // 地面上有一顆泥土方塊 (10, 10, 10)，其下方有石頭 (10, 9, 10)
    world.setBlock(10, 9, 10, BLOCK_TYPES.STONE);
    world.setBlock(10, 10, 10, BLOCK_TYPES.DIRT);

    // 1. 挖：按住挖掉泥土方塊 (0.6 秒)
    const target = { x: 10, y: 10, z: 10 };
    const mineResult = mining.update(0.65, {
      isMining: true,
      target,
      playerPos: { x: player.x, y: player.y, z: player.z },
    });
    expect(mineResult.broken).toBe(true);
    expect(mineResult.blockType).toBe(BLOCK_TYPES.DIRT);
    expect(world.getBlock(10, 10, 10)).toBe(BLOCK_TYPES.AIR);

    // 2. 掉：方塊消失處生成掉落物
    const drop = dropManager.spawn(10.5, 10.5, 10.5, BLOCK_TYPES.DIRT);
    expect(dropManager.drops).toContain(drop);
    // 此時尚未撿起，數量仍為原本的 1
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);

    // 3. 撿：玩家在距離內（約 2 格 < 3 格），更新掉落物被吸入背包，數量 +1 變成 2
    dropManager.update(0.05, player, inventory);
    expect(dropManager.drops).not.toContain(drop);
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(2);

    // 4. 放：對準下方石頭頂面 (10, 9, 10) 的上方按右鍵，將泥土放回 (10, 10, 10)
    const placeSuccess = inventory.placeBlock(world, player, { x: 10, y: 9, z: 10 }, { x: 0, y: 1, z: 0 });
    expect(placeSuccess).toBe(true);
    expect(world.getBlock(10, 10, 10)).toBe(BLOCK_TYPES.DIRT);

    // 最終驗證：數字回到原本的 1，完整走完一輪
    expect(inventory.getItemCount(BLOCK_TYPES.DIRT)).toBe(1);
    expect(inventory.getSelectedSlot().count).toBe(1);
  });
});
