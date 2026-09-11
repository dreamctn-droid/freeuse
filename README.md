# 純前端 PDF 轉圖片工具 (PDF2IMG PURE)

⚡ **100% 免伺服器運算・瀏覽器本機端高清轉檔・完全保護個人隱私**

---

## 🌟 核心特色

1. **零伺服器成本 (Zero Server Load)**：使用 `PDF.js` 與 `HTML5 Canvas` 技術，完全在訪客瀏覽器端完成渲染與轉檔。檔案絕不上傳，無伺服器 CPU/RAM 負擔，永遠不會因為流量被封鎖。
2. **多種畫質與格式**：
   - **格式支援**：PNG (無損高清)、JPEG (高相容性)、WebP (極小體積)。
   - **解析度倍率**：1x (72 DPI)、2x (144 DPI 高清)、3x (216 DPI 超高清)、4x (288 DPI 4K 印刷級)。
   - **品質壓縮**：可自由調整 JPEG / WebP 壓縮比率 (30% ~ 100%)。
3. **批量下載**：整合 `JSZip`，支援單張圖片分別下載或全頁面一鍵打包成 `.zip` 檔案。
4. **極致視覺體驗**：現代深色玻璃擬態 (Glassmorphism) 設計，支援拖曳上傳與全螢幕高畫質預覽。

---

## 🚀 如何部署至 GitHub Pages (免費上線教學)

本專案為 **純靜態網頁 (Static Site)**，可以直接免費託管在 **GitHub Pages** 或 **Cloudflare Pages**。

### 方法一：使用 Git 指令（推薦）

1. **在 GitHub 建立新倉庫 (Repository)**
   - 登入 GitHub，點擊右上方 `+` -> **New repository**。
   - 倉庫名稱填寫例如：`pdf-to-image`（公開 Public）。
   - 請 **不要** 勾選 Add a README file（保持倉庫為空）。

2. **在本地端執行 Git 指令推送**
   開啟終端機 (Terminal / PowerShell)，進入本專案資料夾並執行：

   ```bash
   # 初始化 Git 倉庫
   git init
   git add .
   git commit -m "Initial commit: Pure front-end PDF to Image converter"

   # 切換主分支為 main
   git branch -M main

   # 綁定您的 GitHub 倉庫 (請將 USERNAME 與 REPO 改為您的帳號與專案名)
   git remote add origin https://github.com/USERNAME/pdf-to-image.git

   # 推送至 GitHub
   git push -u origin main
   ```

3. **開啟 GitHub Pages 免費託管**
   - 進入您的 GitHub 倉庫頁面，點擊 **Settings** (設定) 選項卡。
   - 點擊左側選單欄的 **Pages**。
   - 在 **Build and deployment** 下方的 Source 選擇 **Deploy from a branch**。
   - Branch 選擇 `main` / `/root`，然後點擊 **Save**。
   - 約等待 1~2 分鐘，頁面上方將出現您的專案網址（如：`https://USERNAME.github.io/pdf-to-image/`）。

---

### 方法二：透過 GitHub 網頁直接上傳（免開終端機）

1. 登入 GitHub 並建立一個新倉庫 `pdf-to-image`。
2. 點擊 `uploading an existing file`（上傳現有檔案）。
3. 將本專案資料夾內的所有檔案（`index.html`、`css/`、`js/`、`README.md` 等）拖曳上傳。
4. 點擊下方 **Commit changes**。
5. 前往 **Settings -> Pages**，選取 `main` 分支並按 **Save** 即可！

---

## 🌩️ 託管至 Cloudflare Pages (備選方案)

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 前往 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3. 選擇 `pdf-to-image` 倉庫，Framework preset 選擇 `None`，Build command 留空，Build output directory 設定為 `/`。
4. 點擊 **Save and Deploy**，即可獲得極速全域 CDN 加速的純前端工具網址！

---

## 📄 授權條款

MIT License - 開源免費，歡迎自由修改與分享！
