# 📄 Client-Side PDF to JPG Converter & GitHub Uploader

> 100% 純前端（Client-Side Only）的高解析度 PDF 轉圖片與 GitHub 同步上傳 Web 應用程式。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla%20JS-yellow.svg)
![PDF.js](https://img.shields.io/badge/Powered%20by-PDF.js-red.svg)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen.svg)

---

## ✨ 產品亮點 (Key Features)

- 🔒 **100% 隱私安全（Client-Side Only）**：所有 PDF 轉檔、圖片渲染均在瀏覽器端完全執行，檔案絕不上傳至任何第三方中轉伺服器。
- 🖼️ **高清圖像渲染 (Custom DPI)**：支援 150 DPI、200 DPI（推薦）與 300 DPI 印刷級高清解析度。
- 📦 **一鍵打包下載 (ZIP)**：自動將轉換後的所有 JPG 圖片打包為 ZIP 壓縮檔供單機保存。
- 🚀 **GitHub REST API 直連**：內建 GitHub API 客戶端，支援輸入 Personal Access Token (PAT) 後一鍵同步備份至指定的 GitHub 儲存庫。
- 🎨 **現代化高質感 UI**：採用 Dark Mode 深色視覺、玻璃擬態 (Glassmorphism)、漸層霓虹與流暢微動畫設計。

---

## 🛠️ 技術架構 (Tech Stack)

- **前端邏輯**：HTML5, Vanilla JavaScript (ES6+)
- **PDF 渲染引擎**：[PDF.js](https://mozilla.github.io/pdf.js/) (v3.11)
- **ZIP 打包庫**：[JSZip](https://stuk.github.io/jszip/) (v3.10)
- **CSS 樣式設計**：Vanilla CSS3 (Design Tokens, Glassmorphism, Responsive Grid)
- **GitHub API**：GitHub REST API v3 (`PUT /repos/{owner}/{repo}/contents/{path}`)

---

## 📁 專案結構 (Project Structure)

```text
pdf-to-jpg-github/
├── index.html        # 主要網頁入口與 DOM 結構
├── styles.css        # 全局設計系統與深色主題 CSS
├── app.js            # PDF 解析、繪製 Canvas、ZIP 打包與 GitHub API 上傳邏輯
├── README.md         # 專案說明文件
└── LICENSE           # MIT 開源授權條款
```

---

## 🚀 快速開始 (Quick Start)

### 本地使用
1. 下載或 Clone 本專案。
2. 直接點擊開啟 `index.html`（無需安裝 Node.js 或伺服器）。

### 部署至 GitHub Pages
1. 將本專案推送至 GitHub 儲存庫 `dreamctn-droid/freeuse`。
2. 在 Repository 頁面進入 **Settings** -> **Pages**。
3. Source 選擇 `main` 分支並儲存，即可獲得免費的線上轉檔工具網站！

---

## 📄 授權條款 (License)

本專案採用 [MIT License](LICENSE) 開源授權。
