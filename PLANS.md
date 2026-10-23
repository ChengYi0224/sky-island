# PLANS.md — 空島（Sky Island）開發計畫

## 技術架構與開發規範

1. **測試與邏輯分離（Node + Vitest）**
   - 使用 `vitest` 作為測試框架，以 `npm test` 單一指令執行全部單元測試。
   - 遊戲核心邏輯（世界資料、玩家移動與碰撞、挖掘進度、掉落物物理、背包與撿取放置、沙子掉落物理、血量與窒息傷害）全部撰寫於 `src/logic/` 下的純 JS 模組，**不 import `three`**，確保可在 Node 環境直接進行 TDD 測試。
   - `three.js` 與 DOM 操作放在 `src/render/` 與 `src/main.js`，僅負責 3D 畫面渲染、貼圖載入（只用 `assets/` 內素材並設為 `NearestFilter`）、Pointer Lock 第一人稱視角、鍵盤滑鼠輸入與 HUD 更新。
2. **靜態網頁打包（esbuild IIFE Bundle）**
   - 為支援在 Chrome 直接雙擊 `index.html`（`file://` 協定下瀏覽器會阻擋 ES module），使用 `esbuild` 將 `src/main.js` 連同 `three` 與邏輯模組打包為單一 IIFE classic script：`dist/bundle.js`。
   - 每次實作完成皆執行 `npm run build` 更新 `dist/bundle.js` 並一併 commit 入 repo；在 `README.md` 說明 `npm test` 與 `npm run build` 流程。
3. **套件限制與範圍限制**
   - 僅使用 `three`、`vitest`、`esbuild` 三個 npm 套件。
   - 嚴格只做 `BRIEF.md` 與 `VERIFY.md` 要求的功能（不做建築、肚子餓、牧場、農田、水、岩漿等）。
4. **每步執行流程（TDD）**
   - 一次只做一步：先寫該步測試 → 跑 `npm test` 確認失敗 → commit 測試 → 寫程式與打包 `dist/bundle.js` → 跑 `npm test` 確認全部通過 → 在 `PLANS.md` 勾選「這步完成」並連同實作一起 commit，停下來回報。

---

## STEP 0：小島（專案骨架、世界資料、島嶼生成、移動跳躍與視角、Build 流程）

### 要做什麼
- 建立專案骨架（`package.json`、`README.md`、`index.html`、`style.css`），設定 `npm test`（`vitest run`）與 `npm run build`（`esbuild src/main.js --bundle --format=iife --outfile=dist/bundle.js`）。
- 實作 `src/logic/world.js`：建立固定範圍 32×32×32 格以內的世界資料結構、座標邊界檢查、方塊讀寫介面，並生成懸浮於空中的初始小島（包含草地、泥土、石頭、沙子等方塊，不含建築）。
- 實作 `src/logic/player.js`：實作玩家位置、速度、AABB 碰撞箱、WASD 前後左右水平移動與方塊側面碰撞阻擋（不穿牆）、重力加速度與空白鍵跳躍（跳起約 1 格高並落回方塊頂面，空中不可無限二段跳）。
- 實作 `src/render/textures.js`、`src/render/scene.js`、`src/main.js`：載入 `assets/` 中的 16×16 像素貼圖並設定 `THREE.NearestFilter`；建立小島方塊 Mesh（僅渲染可見面以維持舊電腦全螢幕 30 fps 以上）；實作點擊畫面 Pointer Lock 鎖定滑鼠、第一人稱視角自由旋轉、畫面中央準星，並將鍵盤輸入接入玩家移動與跳躍邏輯。
- 撰寫 `tests/world.test.js` 與 `tests/player.test.js` 驗證世界範圍、島嶼方塊種類、玩家移動碰撞與跳躍邏輯，並執行 `npm run build` 產出 `dist/bundle.js`。

### 對到 VERIFY.md 的哪幾條
- [ ] （AI 補充）雙擊 `index.html` 即可在瀏覽器直接開啟遊玩（純 HTML、CSS、JS 靜態網站，不需啟動伺服器、不需登入帳號、不使用外部遊戲引擎）
- [ ] （AI 補充）畫面中有一座懸在空中的小島，島上包含草地、泥土、石頭、沙子等方塊
- [ ] （AI 補充）點擊畫面鎖定滑鼠後，移動滑鼠可自由旋轉第一人稱視角，畫面中央顯示準星
- [ ] （AI 補充）按 `W`、`A`、`S`、`D` 鍵可控制玩家前後左右走路移動，碰到方塊側面時會被擋住，不會穿牆
- [ ] （AI 補充）按空白鍵（`Space`）可往上跳起約 1 格高，並受重力落回方塊頂面；在空中時按空白鍵不可以無限二段跳
- [ ] （AI 補充）世界範圍固定在 32×32×32 格以內（不做無限世界、不做多人連線）
- [ ] （AI 補充）在學校舊電腦（內顯或僅用 CPU）全螢幕遊玩時，畫面維持每秒 30 格（30 fps）以上
- [ ] （AI 補充）只使用 `assets/`（`sky-island-assets.zip`）內的 16×16 素材（方塊材質、圖示、挖方塊裂痕），且貼圖設為像素銳利（`NearestFilter`），不糊掉

### 會動哪些檔
- `package.json`
- `README.md`
- `index.html`
- `style.css`
- `src/logic/world.js`
- `src/logic/player.js`
- `src/render/textures.js`
- `src/render/scene.js`
- `src/main.js`
- `tests/world.test.js`
- `tests/player.test.js`
- `dist/bundle.js`
- `PLANS.md`

- [x] 這步完成

---

## STEP 1：挖方塊

### 要做什麼
- 實作 `src/logic/mining.js`：
  - 定義各類方塊挖掘所需時間：泥土、草地、沙子不到 1 秒（例如 0.6～0.8 秒），石頭比泥土久、約 2 秒。
  - 限制有效挖掘距離為 4 格以內（超過 4 格按住左鍵不累積進度、不出現裂痕、不會被挖掉）。
  - 按住滑鼠左鍵對準目標方塊時隨時間累積進度並計算裂痕階段（越裂越大），進度達 100% 時移除該方塊；只點一下左鍵不會直接挖掉方塊。
  - 挖到一半放開左鍵，或將準星移開到別的方塊／空氣時，裂痕立即消失且挖掘進度歸零，下次需從頭挖起。
- 在 `src/render/scene.js`、`src/render/textures.js` 與 `src/main.js` 整合視線 Raycast 目標方塊偵測、載入 `assets/` 中的裂痕貼圖（`NearestFilter`）顯示於目標方塊表面，並在挖掘完成時更新場景方塊。
- 撰寫 `tests/mining.test.js` 測試挖掘時間差異、距離上限、按住累積進度、點一下不消失、放開或移開準星重置進度等行為。

### 對到 VERIFY.md 的哪幾條
- [ ] 按住左鍵挖 → 越裂越大，不到 1 秒不見
- [ ] 不可以：只點一下就不見
- [ ] 挖到一半放開 → 裂痕不見，要從頭挖
- [ ] 挖石頭 → 比泥土久，大約 2 秒
- [ ] （AI 補充）挖到一半把準星移開到別的方塊或空氣 → 原本方塊的裂痕立刻消失，挖掘進度歸零
- [ ] （AI 補充）不可以：隔太遠挖方塊（距離超過 4 格以外的方塊按住左鍵不會出現裂痕、也不會被挖掉）

### 會動哪些檔
- `src/logic/mining.js`
- `src/render/textures.js`
- `src/render/scene.js`
- `src/main.js`
- `tests/mining.test.js`
- `dist/bundle.js`
- `PLANS.md`

- [x] 這步完成

---

## STEP 2：掉出來

### 要做什麼
- 實作 `src/logic/drops.js`：
  - 當方塊被挖掉消失時，於該格位置生成同種類的掉落物小方塊 entity（帶有微幅向上彈跳初速與持續旋轉角度更新）。
  - 掉落物小方塊受重力往下掉，碰到下方實體方塊頂面時停在頂面上，不會浮在空中也不會穿過地面。
  - 若小方塊下方的支撐方塊被挖掉，小方塊會再次受重力繼續往下掉，直到落到新的實體方塊頂面為止。
- 在 `src/render/scene.js` 與 `src/main.js` 渲染縮小的掉落物方塊 Mesh 並隨每幀更新位置與緩慢自轉動畫。
- 撰寫 `tests/drops.test.js` 測試方塊破壞生成同種類掉落物、旋轉角度遞增、重力下落與地面支撐停住、下方方塊被挖除後繼續掉落等邏輯。

### 對到 VERIFY.md 的哪幾條
- [ ] 方塊不見 → 彈出同種類的小方塊，慢慢轉
- [ ] 不可以：浮在空中、穿過地面
- [ ] （AI 補充）掉落的小方塊受重力落到下方實體方塊頂面後停住；若把下方的支撐方塊挖掉，小方塊會繼續往下掉到新的地面

### 會動哪些檔
- `src/logic/drops.js`
- `src/logic/mining.js`
- `src/render/scene.js`
- `src/main.js`
- `tests/drops.test.js`
- `dist/bundle.js`
- `PLANS.md`

- [x] 這步完成

---

## STEP 3：撿起來

### 要做什麼
- 實作 `src/logic/inventory.js`（背包與撿取部分）及擴充 `src/logic/drops.js`：
  - 建立快捷欄資料結構（記錄各格對應的方塊種類與數量）。
  - 計算玩家與掉落物小方塊的距離：當玩家走到距離 3 格以內時，觸發小方塊飛向玩家身上並被撿起，對應種類的快捷欄格子數量 +1；若站在 3 格以外則不會被撿起來。
  - 不同種類的小方塊（如草地、泥土、石頭、沙子）撿起後分別加進對應種類的快捷欄格子數字。
- 建立 `src/render/hud.js` 並更新 `index.html`、`style.css`、`src/main.js`：在畫面下方顯示快捷欄 UI（使用 `assets/` 內的圖示／貼圖與數量數字），並呈現小方塊飛向玩家的視覺效果。
- 撰寫 `tests/inventory.test.js` 測試 3 格內自動靠近撿取、對應種類數量 +1、超過 3 格不撿取、不同種類分開累計等邏輯。

### 對到 VERIFY.md 的哪幾條
- [ ] 走到旁邊 → 飛到身上，那一格數字 +1
- [ ] 不可以：站在 3 格外也被撿起來
- [ ] （AI 補充）畫面上看得到快捷欄（含方塊圖示與數量數字），撿起不同種類的小方塊（如泥土、石頭、沙子）會分別加進對應種類的格子數字

### 會動哪些檔
- `src/logic/inventory.js`
- `src/logic/drops.js`
- `src/render/hud.js`
- `src/main.js`
- `index.html`
- `style.css`
- `tests/inventory.test.js`
- `dist/bundle.js`
- `PLANS.md`

- [x] 這步完成

---

## STEP 4：放回去

### 要做什麼
- 擴充 `src/logic/inventory.js` 與 `src/logic/world.js`（放置方塊與快捷欄切換）：
  - 支援以數字鍵或滑鼠滾輪切換快捷欄目前選中的格子。
  - 對準距離 4 格內的目標方塊表面按滑鼠右鍵時，計算該面相鄰的目標放置座標。
  - 檢查放置條件：選中格子的方塊數量必須大於 0（數量為 0 時不可放出）、目標座標在 32×32×32 世界邊界內、且目標方塊碰撞箱不與玩家自身碰撞箱重疊。
  - 通過檢查後在目標位置放出對應種類的方塊，並將該格數量 −1；支援完整「挖方塊 → 掉出來 → 撿起來（+1）→ 放回去（−1）」循環後數量回到原本數值。
- 在 `src/render/hud.js`、`src/render/scene.js`、`src/main.js` 綁定數字鍵、滾輪與滑鼠右鍵放置事件，並即時更新快捷欄選中框與數量顯示。
- 在 `tests/inventory.test.js` 新增切換快捷欄、右鍵放置扣減數量、數量為 0 禁止放置、與玩家重疊或超出 32×32×32 邊界禁止放置、以及「挖 → 掉 → 撿 → 放」完整流程數量還原的測試。

### 對到 VERIFY.md 的哪幾條
- [ ] 選那一格按右鍵 → 放出一格，數字 −1
- [ ] 不可以：數字是 0 還放得出來
- [ ] 整串走一遍 → 數字回到原本
- [ ] （AI 補充）可用數字鍵或滾輪切換快捷欄選中的格子，對準方塊表面（距離 4 格內）按右鍵會在該面相鄰處放出對應種類的方塊
- [ ] （AI 補充）不可以：把方塊放在與玩家自身碰撞箱重疊的位置，或超出 32×32×32 世界邊界外

### 會動哪些檔
- `src/logic/inventory.js`
- `src/logic/world.js`
- `src/render/hud.js`
- `src/render/scene.js`
- `src/main.js`
- `tests/inventory.test.js`
- `dist/bundle.js`
- `PLANS.md`

- [ ] 這步完成

---

## STEP 5a：沙子掉落物理與堆疊

### 要做什麼
- 實作 `src/logic/sand.js`：
  - **觸發轉為 entity**：當沙子方塊被放置在懸空位置（下方為空氣），或沙子正下方的支撐方塊被挖掉時，移除原格子的沙子方塊並立刻在該位置生成向下運動的沙子 entity；若垂直堆疊多格沙子，挖掉最底部支撐後整疊沙子由下而上依序轉成沙子 entity 掉落。
  - **加速度與速度上限**：沙子 entity 初始向下速度為 0 格/秒，受重力加速度 20 格/秒² 向下加速，且向下最大速度上限為 16 格/秒（達到 16 格/秒後維持等速下落）。
  - **同空間多 entity 共存**：以陣列管理所有沙子 entity，在同一垂直座標柱（同 X、Z）連續快速放置或同時觸發多個沙子掉落時，同一格空間範圍內可同時存在多個下落中的沙子 entity，不會互相覆蓋或消失。
  - **落地轉回方塊與依序堆疊**：沙子 entity 掉到下方實體方塊頂面時立即停住並轉回實體沙子方塊（絕不穿透下方實體方塊）；若多個沙子 entity 先後落到同一（X, Z）位置，會由下往上依序堆疊成一格一格的沙子方塊，不會重疊在同一格。
- 在 `src/render/scene.js` 與 `src/main.js` 渲染下落中的沙子 entity Mesh，並在每幀更新沙子物理與世界方塊 Mesh。
- 撰寫 `tests/sand.test.js` 測試懸空放置觸發、挖除下方支撐整疊觸發、加速度 20 格/秒² 與 16 格/秒速度上限、同垂直柱多 entity 共存、落地不穿透與依序向上堆疊等邏輯。

### 對到 VERIFY.md 的哪幾條
- [ ] 下面沒有方塊的時候轉成entity並向下運動
- [ ] 加速度存在但有速度上限
- [ ] 同一個可以多個entity
- [ ] 不可以:穿透實體方塊
- [ ] （AI 補充）轉成 entity 掉落的觸發條件：把沙子放在懸空位置（下方為空氣），或把沙子正下方的支撐方塊挖掉時，沙子方塊會立刻轉為沙子 entity 向下移動；若垂直堆疊多格沙子，挖掉最底部支撐後整疊沙子都會依序轉成 entity 掉落
- [ ] （AI 補充）加速度與速度上限具體數值：沙子 entity 初始向下速度為 0 格/秒，以重力加速度（例如 20 格/秒²）向下加速，且向下最大速度上限為 16 格/秒（高處掉落達上限後維持等速，不再繼續加速）
- [ ] （AI 補充）同一空間多個 entity 具體測試：在同一垂直座標柱（同 X、Z）連續快速放置或同時觸發 2 個以上沙子掉落時，同一格空間範圍內可同時存在多個下落中的沙子 entity，不會互相吃掉或消失
- [ ] （AI 補充）落地轉回實體方塊與堆疊：沙子 entity 掉到下方實體方塊頂面時會停住並轉回沙子方塊（不穿透）；若多個沙子 entity 先後落到同一位置，會由下往上依序堆疊成一格一格的沙子方塊，不會重疊在同一格

### 會動哪些檔
- `src/logic/sand.js`
- `src/logic/world.js`
- `src/logic/mining.js`
- `src/logic/inventory.js`
- `src/render/scene.js`
- `src/main.js`
- `tests/sand.test.js`
- `dist/bundle.js`
- `PLANS.md`

- [ ] 這步完成

---

## STEP 5b：窒息傷害與血量顯示

### 要做什麼
- 實作 `src/logic/health.js` 及調整 `src/logic/player.js`：
  - 玩家預設滿血為 20 點（對應 10 顆心）。
  - 窒息判定：檢查玩家頭部所在格子是否為實體沙子方塊（例如沙子掉落落地後埋住玩家頭部）。當頭部所在格子為沙子方塊時，累積窒息計時，每滿 0.5 秒扣 1 點血量（最低扣至 0）。
  - 若沙子只蓋住玩家腳部而頭部所在格子為空氣，則不扣血；當玩家挖開頭頂沙子或走出沙子使頭部離開沙子方塊後，立即停止扣血並重置窒息計時器。
- 擴充 `src/render/hud.js`、`index.html`、`style.css` 與 `src/main.js`：在畫面上顯示玩家目前血量（用 HTML/CSS 文字顯示血量數字（素材包沒有愛心圖，不另外找圖）），當發生窒息扣血時即時更新畫面血量。
- 撰寫 `tests/health.test.js` 測試預設 20 點血量、頭部埋入沙子每 0.5 秒扣 1 點血、僅埋住腳部不扣血、挖開頭頂沙子或走出沙子後停止扣血等邏輯。

### 對到 VERIFY.md 的哪幾條
- [ ] 埋住玩家會有窒息傷害
- [ ] （AI 補充）血量顯示（最小需求）：畫面上看得到玩家目前血量（例如預設滿血 20 點／10 顆心），以便觀察窒息扣血變化
- [ ] （AI 補充）窒息傷害具體標準：當沙子方塊落在玩家頭部所在格子（埋住玩家頭部）時，每 0.5 秒扣 1 點血量，畫面血量隨之減少；挖開頭頂沙子或走出沙子後停止扣血（若沙子只蓋住腳部而頭部在空氣中則不扣血）

### 會動哪些檔
- `src/logic/health.js`
- `src/logic/player.js`
- `src/render/hud.js`
- `src/main.js`
- `index.html`
- `style.css`
- `tests/health.test.js`
- `dist/bundle.js`
- `PLANS.md`

- [ ] 這步完成
