# 渝蓉行 · 重慶成都 2026/10/25–11/1

手機用的行程 App。每個行程點都有：

- **高德・叫車**：打開高德並搜尋這個地點，選對結果後按「打車」就能叫車
- **路線**：直接規劃開車路線（座標是概略的，要精準請用「高德・叫車」）
- **周邊**：找附近的美食、咖啡、便利店、廁所、地鐵站、藥店、ATM
- 每天一張路線示意圖，點圖上號碼會跳到那個行程，可放大
- 打勾記錄去過的地方（存在手機本機）
- 打開時自動跳到「今天」那一天（以北京時間判斷）
- 可離線：第一次有網路時打開過，之後沒網路也能看行程

## 部署到 GitHub Pages

1. 在 GitHub 建一個新的 repository（例如 `cq-cd-trip`）
2. 把這個資料夾推上去：
   ```bash
   git remote add origin https://github.com/<你的帳號>/cq-cd-trip.git
   git push -u origin main
   ```
3. 到 repository 的 **Settings → Pages**，Source 選 `Deploy from a branch`，Branch 選 `main`、資料夾 `/ (root)`，按 Save
4. 一兩分鐘後網址會是 `https://<你的帳號>.github.io/cq-cd-trip/`

## 加到手機主畫面

- iPhone：用 Safari 打開網址 → 分享 → 加入主畫面
- Android：用 Chrome 打開網址 → 選單 → 加到主畫面

**出發前在台灣先打開一次**，讓它把檔案存到手機裡。到大陸後 github.io 有時連不上，但已存好的 App 仍可使用；高德按鈕需要網路。

## 修改行程

所有行程都在 `index.html` 裡的 `DAYS` 陣列：

- `kw`：高德搜尋用的關鍵字（用簡體中文最準）
- `c`：城市
- `ll`：大約座標 `[經度, 緯度]`，用在「周邊」和「路線」
- `{leg:"叫車 10 分"}`：兩個點之間的交通說明，加 `walk:1` 會顯示成虛線

改完 commit、push，GitHub Pages 會自動更新。若手機還顯示舊版，把 `sw.js` 裡的 `CACHE` 版本號加 1 再 push。
