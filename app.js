/**
 * PDF2IMG Pure - Client-side Converter Core Engine
 * Powered by PDF.js & JSZip
 */

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global State
let currentPdfDoc = null;
let currentFile = null;
let renderedImages = []; // Stores objects: { pageNum, dataUrl, width, height, format }
let isRendering = false;

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const controlsSection = document.getElementById('controls-section');
const fileNameEl = document.getElementById('file-name');
const fileMetaEl = document.getElementById('file-meta');
const reuploadBtn = document.getElementById('reupload-btn');
const formatGroup = document.getElementById('format-group');
const scaleGroup = document.getElementById('scale-group');
const qualityCard = document.getElementById('quality-card');
const qualityRange = document.getElementById('quality-range');
const qualityValue = document.getElementById('quality-value');
const startConvertBtn = document.getElementById('start-convert-btn');
const downloadZipBtn = document.getElementById('download-zip-btn');
const progressSection = document.getElementById('progress-section');
const progressStatusText = document.getElementById('progress-status-text');
const progressPercent = document.getElementById('progress-percent');
const progressBarFill = document.getElementById('progress-bar-fill');
const previewSection = document.getElementById('preview-section');
const previewGrid = document.getElementById('preview-grid');
const renderedCountBadge = document.getElementById('rendered-count-badge');

// Modal Elements
const imageModal = document.getElementById('image-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');
const modalImg = document.getElementById('modal-img');
const modalDownloadBtn = document.getElementById('modal-download-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                handleFileSelect(file);
            } else {
                alert('請上傳有效的 PDF 格式檔案！');
            }
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    reuploadBtn.addEventListener('click', () => {
        fileInput.value = '';
        currentPdfDoc = null;
        currentFile = null;
        renderedImages = [];
        controlsSection.classList.add('hidden');
        progressSection.classList.add('hidden');
        previewSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    // Option Chips Behavior
    setupRadioGroup(formatGroup, (val) => {
        if (val === 'png') {
            qualityCard.style.opacity = '0.4';
            qualityCard.style.pointerEvents = 'none';
        } else {
            qualityCard.style.opacity = '1';
            qualityCard.style.pointerEvents = 'auto';
        }
    });
    setupRadioGroup(scaleGroup, () => {});

    // Quality Slider
    qualityRange.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
    });

    // Start Convert Action
    startConvertBtn.addEventListener('click', () => {
        if (currentPdfDoc && !isRendering) {
            renderPdfToImages();
        }
    });

    // Download ZIP
    downloadZipBtn.addEventListener('click', downloadAllAsZip);

    // Modal Events
    modalBackdrop.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
}

function setupRadioGroup(container, callback) {
    const chips = container.querySelectorAll('.radio-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const radio = chip.querySelector('input');
            radio.checked = true;
            if (callback) callback(radio.value);
        });
    });
}

// Handle PDF Selection & Read Header
async function handleFileSelect(file) {
    currentFile = file;
    fileNameEl.textContent = file.name;
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        currentPdfDoc = await loadingTask.promise;

        fileMetaEl.textContent = `頁數：${currentPdfDoc.numPages} 頁 | 大小：${sizeInMB} MB`;

        dropZone.classList.add('hidden');
        controlsSection.classList.remove('hidden');
        previewSection.classList.add('hidden');
        downloadZipBtn.classList.add('hidden');
        
        // Auto trigger rendering
        renderPdfToImages();
    } catch (err) {
        console.error('PDF 解析失敗:', err);
        alert('無法讀取該 PDF 檔案，可能已損壞或受密碼保護。');
    }
}

// Render PDF Pages to Canvas & Extract Images
async function renderPdfToImages() {
    if (!currentPdfDoc) return;

    isRendering = true;
    renderedImages = [];
    previewGrid.innerHTML = '';
    
    const numPages = currentPdfDoc.numPages;
    const format = document.querySelector('input[name="format"]:checked').value;
    const scale = parseFloat(document.querySelector('input[name="scale"]:checked').value);
    const quality = parseInt(qualityRange.value, 10) / 100;

    // Show Progress Bar
    progressSection.classList.remove('hidden');
    previewSection.classList.remove('hidden');
    downloadZipBtn.classList.add('hidden');
    updateProgress(0, `準備繪製 1 / ${numPages} 頁...`);

    let mimeType = 'image/png';
    if (format === 'jpeg') mimeType = 'image/jpeg';
    if (format === 'webp') mimeType = 'image/webp';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        updateProgress(
            Math.round(((pageNum - 1) / numPages) * 100),
            `正在高畫質渲染第 ${pageNum} / ${numPages} 頁...`
        );

        const page = await currentPdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        // Offscreen Canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render PDF page to canvas
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;

        // Export Image Data URL
        let dataUrl;
        if (format === 'png') {
            dataUrl = canvas.toDataURL('image/png');
        } else {
            dataUrl = canvas.toDataURL(mimeType, quality);
        }

        const imgObj = {
            pageNum: pageNum,
            dataUrl: dataUrl,
            width: Math.round(viewport.width),
            height: Math.round(viewport.height),
            format: format
        };

        renderedImages.push(imgObj);
        appendPreviewCard(imgObj);
        renderedCountBadge.textContent = `已生成 ${renderedImages.length} / ${numPages} 頁`;
    }

    updateProgress(100, '所有頁面轉檔完成！');
    setTimeout(() => {
        progressSection.classList.add('hidden');
    }, 1200);

    isRendering = false;
    downloadZipBtn.classList.remove('hidden');
}

function updateProgress(percent, statusText) {
    progressPercent.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;
    progressStatusText.textContent = statusText;
}

// Append Page Card to Grid
function appendPreviewCard(imgObj) {
    const card = document.createElement('div');
    card.className = 'page-card';

    const ext = imgObj.format === 'jpeg' ? 'jpg' : imgObj.format;
    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "page";
    const fileName = `${baseName}_page_${imgObj.pageNum}.${ext}`;

    card.innerHTML = `
        <div class="card-img-wrapper" data-page="${imgObj.pageNum}">
            <img src="${imgObj.dataUrl}" alt="Page ${imgObj.pageNum}">
            <div class="img-overlay">
                <i class="fa-solid fa-magnifying-glass-plus"></i>
            </div>
        </div>
        <div class="card-info">
            <div>
                <div class="page-num">第 ${imgObj.pageNum} 頁</div>
                <div class="page-dim">${imgObj.width} × ${imgObj.height} px</div>
            </div>
            <button class="card-download-btn" title="下載此頁" data-name="${fileName}" data-url="${imgObj.dataUrl}">
                <i class="fa-solid fa-download"></i>
            </button>
        </div>
    `;

    // Click on preview image to enlarge
    const imgWrapper = card.querySelector('.card-img-wrapper');
    imgWrapper.addEventListener('click', () => {
        openModal(imgObj.dataUrl, fileName);
    });

    // Click single download
    const downloadBtn = card.querySelector('.card-download-btn');
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerDownload(imgObj.dataUrl, fileName);
    });

    previewGrid.appendChild(card);
}

// Single File Download
function triggerDownload(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Download All Images as ZIP
async function downloadAllAsZip() {
    if (renderedImages.length === 0) return;

    downloadZipBtn.disabled = true;
    downloadZipBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在打包 ZIP 壓縮檔...`;

    const zip = new JSZip();
    const folder = zip.folder("pdf_images");

    const baseName = currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "pdf_converted";

    renderedImages.forEach((imgObj) => {
        const ext = imgObj.format === 'jpeg' ? 'jpg' : imgObj.format;
        const fileName = `${baseName}_page_${imgObj.pageNum}.${ext}`;
        // Remove Base64 Header (e.g. data:image/png;base64,)
        const base64Data = imgObj.dataUrl.split(',')[1];
        folder.file(fileName, base64Data, { base64: true });
    });

    try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipUrl = URL.createObjectURL(zipBlob);
        triggerDownload(zipUrl, `${baseName}_all_images.zip`);
        setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);
    } catch (err) {
        console.error("ZIP 打包失敗:", err);
        alert("壓縮檔打包過程發生錯誤，請稍後重試。");
    } finally {
        downloadZipBtn.disabled = false;
        downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> 一鍵下載全頁 ZIP 包`;
    }
}

// Modal Functions
function openModal(dataUrl, fileName) {
    modalImg.src = dataUrl;
    modalDownloadBtn.href = dataUrl;
    modalDownloadBtn.download = fileName;
    imageModal.classList.remove('hidden');
}

function closeModal() {
    imageModal.classList.add('hidden');
}
