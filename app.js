/* ==========================================================================
   PDF to JPG & GitHub Uploader - Core Application Logic
   ========================================================================== */

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Global state
let currentPdfDoc = null;
let currentPdfName = 'document';
let convertedJpgs = []; // array of { pageNum, blob, dataUrl, filename }

// DOM Elements
const pdfFileInput = document.getElementById('pdfFileInput');
const dropzone = document.getElementById('dropzone');
const convertBtn = document.getElementById('convertBtn');
const qualitySelect = document.getElementById('qualitySelect');
const pageRangeInput = document.getElementById('pageRangeInput');
const previewGrid = document.getElementById('previewGrid');
const previewSection = document.getElementById('previewSection');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const uploadGithubBtn = document.getElementById('uploadGithubBtn');

// GitHub Form Elements
const ghRepoInput = document.getElementById('ghRepoInput');
const ghBranchInput = document.getElementById('ghBranchInput');
const ghFolderInput = document.getElementById('ghFolderInput');
const ghTokenInput = document.getElementById('ghTokenInput');
const ghCommitMsgInput = document.getElementById('ghCommitMsgInput');

// Status & Logs
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const logBox = document.getElementById('logBox');

// Load saved settings from localStorage
window.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('gh_repo')) ghRepoInput.value = localStorage.getItem('gh_repo');
  if (localStorage.getItem('gh_branch')) ghBranchInput.value = localStorage.getItem('gh_branch');
  if (localStorage.getItem('gh_folder')) ghFolderInput.value = localStorage.getItem('gh_folder');
  if (localStorage.getItem('gh_token')) ghTokenInput.value = localStorage.getItem('gh_token');
});

// Save settings on change
[ghRepoInput, ghBranchInput, ghFolderInput, ghTokenInput].forEach(input => {
  if (input) {
    input.addEventListener('change', () => {
      if (input === ghRepoInput) localStorage.setItem('gh_repo', input.value);
      if (input === ghBranchInput) localStorage.setItem('gh_branch', input.value);
      if (input === ghFolderInput) localStorage.setItem('gh_folder', input.value);
      if (input === ghTokenInput) localStorage.setItem('gh_token', input.value);
    });
  }
});

// Drag & Drop event handlers
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    pdfFileInput.files = e.dataTransfer.files;
    handlePdfSelect(e.dataTransfer.files[0]);
  }
});

pdfFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handlePdfSelect(e.target.files[0]);
  }
});

function appendLog(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  logBox.appendChild(entry);
  logBox.scrollTop = logBox.scrollHeight;
}

async function handlePdfSelect(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endswith('.pdf')) {
    alert('請選擇有效的 PDF 檔案！');
    return;
  }

  currentPdfName = file.name.replace(/\.[^/.]+$/, "");
  appendLog(`已選擇 PDF 檔案: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    currentPdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    appendLog(`PDF 載入成功！總頁數: ${currentPdfDoc.numPages} 頁`, 'success');
    convertBtn.disabled = false;
    document.getElementById('dropzoneText').textContent = `已載入: ${file.name} (${currentPdfDoc.numPages} 頁)`;
  } catch (err) {
    appendLog(`PDF 載入失敗: ${err.message}`, 'error');
    alert('無法解析此 PDF 檔案');
  }
}

// Convert PDF to JPG
convertBtn.addEventListener('click', async () => {
  if (!currentPdfDoc) return;
  
  convertedJpgs = [];
  previewGrid.innerHTML = '';
  previewSection.style.display = 'block';
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  convertBtn.disabled = true;
  
  const scale = parseFloat(qualitySelect.value) || 2.0; // 2.0 scale approx 150-200 DPI
  const totalPages = currentPdfDoc.numPages;
  
  // Parse page range
  let targetPages = [];
  const rangeVal = pageRangeInput.value.trim();
  if (!rangeVal) {
    for (let i = 1; i <= totalPages; i++) targetPages.push(i);
  } else {
    const parts = rangeVal.split(',');
    for (let p of parts) {
      if (p.includes('-')) {
        const [start, end] = p.split('-').map(n => parseInt(n.trim()));
        if (start && end) {
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            if (i >= 1 && i <= totalPages) targetPages.push(i);
          }
        }
      } else {
        const pNum = parseInt(p.trim());
        if (pNum >= 1 && pNum <= totalPages) targetPages.push(pNum);
      }
    }
  }
  
  if (targetPages.length === 0) {
    appendLog('無效的頁數範圍設定！', 'error');
    convertBtn.disabled = false;
    return;
  }
  
  appendLog(`開始轉換 ${targetPages.length} 頁 PDF 為 JPG (解析度倍率: ${scale}x)...`, 'info');
  
  for (let idx = 0; idx < targetPages.length; idx++) {
    const pageNum = targetPages[idx];
    try {
      const page = await currentPdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      // Convert canvas to JPG blob & DataURL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      const filename = `${currentPdfName}_page_${String(pageNum).padStart(3, '0')}.jpg`;

      convertedJpgs.push({ pageNum, blob, dataUrl, filename });
      
      // Render Preview Card
      renderPreviewCard(pageNum, dataUrl, filename, blob);

      const percent = Math.round(((idx + 1) / targetPages.length) * 100);
      progressBar.style.width = `${percent}%`;
      appendLog(`✓ 第 ${pageNum} 頁轉換完成 -> ${filename}`, 'success');

    } catch (err) {
      appendLog(`✕ 第 ${pageNum} 頁轉換失敗: ${err.message}`, 'error');
    }
  }

  appendLog(`🎉 全部 ${convertedJpgs.length} 頁 JPG 轉換完畢！`, 'success');
  convertBtn.disabled = false;
  downloadAllBtn.disabled = false;
  uploadGithubBtn.disabled = false;
});

function renderPreviewCard(pageNum, dataUrl, filename, blob) {
  const card = document.createElement('div');
  card.className = 'preview-card';
  card.innerHTML = `
    <div class="preview-img-wrapper">
      <img src="${dataUrl}" alt="Page ${pageNum}">
    </div>
    <div class="preview-info">
      <span class="page-tag">第 ${pageNum} 頁</span>
      <button class="btn btn-primary btn-sm" onclick="downloadSingle('${filename}', '${dataUrl}')">下載</button>
    </div>
  `;
  previewGrid.appendChild(card);
}

window.downloadSingle = function(filename, dataUrl) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
};

// Batch Download ZIP
downloadAllBtn.addEventListener('click', async () => {
  if (convertedJpgs.length === 0) return;
  
  appendLog('正在打包 ZIP 檔案...', 'info');
  const zip = new JSZip();
  const folder = zip.folder(currentPdfName);
  
  convertedJpgs.forEach(item => {
    folder.file(item.filename, item.blob);
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = `${currentPdfName}_JPG_images.zip`;
  a.click();
  appendLog('ZIP 下載完成！', 'success');
});

// Upload to GitHub
uploadGithubBtn.addEventListener('click', async () => {
  const repo = ghRepoInput.value.trim();
  const branch = ghBranchInput.value.trim() || 'main';
  const folder = ghFolderInput.value.trim() || 'images';
  const token = ghTokenInput.value.trim();
  const commitMsg = ghCommitMsgInput.value.trim() || `Upload PDF JPGs (${convertedJpgs.length} pages)`;

  if (!repo || !repo.includes('/')) {
    alert('請輸入有效的 GitHub 儲存庫名稱 (例如: owner/repository)');
    return;
  }
  if (!token) {
    alert('請填寫 GitHub Personal Access Token (PAT)！');
    return;
  }

  if (convertedJpgs.length === 0) {
    alert('請先將 PDF 轉換為 JPG！');
    return;
  }

  const [owner, repoName] = repo.split('/');
  uploadGithubBtn.disabled = true;
  appendLog(`🚀 開始上傳 ${convertedJpgs.length} 個 JPG 至 GitHub (${repo})...`, 'info');

  let successCount = 0;
  for (let idx = 0; idx < convertedJpgs.length; idx++) {
    const item = convertedJpgs[idx];
    const targetPath = folder ? `${folder}/${item.filename}` : item.filename;
    
    appendLog(`正在上傳 ${item.filename} 到 ${targetPath}...`, 'info');

    try {
      const base64Data = item.dataUrl.split(',')[1];
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${encodeURIComponent(targetPath).replace(/%2F/g, '/')}`;

      // Check existing file SHA for updates
      let sha = null;
      try {
        const checkResp = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (checkResp.ok) {
          const checkData = await checkResp.json();
          sha = checkData.sha;
        }
      } catch (e) {
        // file doesn't exist yet
      }

      const body = {
        message: `${commitMsg} - page ${item.pageNum}`,
        content: base64Data,
        branch: branch
      };
      if (sha) body.sha = sha;

      const uploadResp = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
      });

      if (uploadResp.ok) {
        const resData = await uploadResp.json();
        successCount++;
        const htmlUrl = resData.content?.html_url || '';
        appendLog(`✓ 成功上傳 [第 ${item.pageNum} 頁]: ${htmlUrl}`, 'success');
      } else {
        const errData = await uploadResp.json();
        appendLog(`✕ 上傳失敗 [第 ${item.pageNum} 頁]: ${errData.message}`, 'error');
      }

    } catch (err) {
      appendLog(`✕ 上傳網路錯誤 [第 ${item.pageNum} 頁]: ${err.message}`, 'error');
    }
  }

  appendLog(`✨ 上傳完成！成功 ${successCount}/${convertedJpgs.length} 個檔案`, successCount > 0 ? 'success' : 'error');
  uploadGithubBtn.disabled = false;
});
