const form = document.getElementById('translate-form');
const statusEl = document.getElementById('status');
const submitBtn = document.getElementById('submit-btn');
const sourceSelect = document.getElementById('sourceLang');
const targetSelect = document.getElementById('targetLang');
const providerSelect = document.getElementById('provider');
const keyStatusEl = document.getElementById('key-status');

const settingsOverlay = document.getElementById('settings-overlay');
const settingsBtn = document.getElementById('settings-btn');
const settingsSave = document.getElementById('settings-save');
const settingsCancel = document.getElementById('settings-cancel');
const settingsCloseBtn = document.getElementById('settings-close');
const settingsClear = document.getElementById('settings-clear');

const resultEl = document.getElementById('result');
const resultName = document.getElementById('result-name');
const resultSize = document.getElementById('result-size');
const resultPreview = document.getElementById('result-preview');
const resultDownload = document.getElementById('result-download');
const resultClose = document.getElementById('result-close');

const themeToggle = document.getElementById('theme-toggle');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file');
const fileChip = document.getElementById('file-chip');
const fileChipName = document.getElementById('file-chip-name');
const fileChipSize = document.getElementById('file-chip-size');
const fileRemoveBtn = document.getElementById('file-remove');

const PROVIDERS = ['openai', 'gemini', 'claude', 'deepseek'];
const STORAGE_KEY = 'ai-doc-translator-settings';
const THEME_KEY = 'ai-doc-translator-theme';

// ---- Theme (light default, dark via [data-theme="dark"]) ----

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

applyTheme(localStorage.getItem(THEME_KEY) || 'light');

// ---- Settings (per-provider API key + model, persisted in localStorage) ----

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function fillSettingsForm() {
  const settings = loadSettings();
  for (const p of PROVIDERS) {
    document.getElementById(`key-${p}`).value = settings[p]?.apiKey || '';
    document.getElementById(`model-${p}`).value = settings[p]?.model || '';
  }
}

function updateKeyStatus() {
  const settings = loadSettings();
  const provider = providerSelect.value;
  const hasKey = !!settings[provider]?.apiKey;
  keyStatusEl.textContent = hasKey
    ? 'Đã có API key (lưu trong trình duyệt)'
    : 'Chưa có key — bấm "Cài đặt" để nhập, hoặc dùng key cấu hình sẵn phía server';
}

function openSettings() {
  fillSettingsForm();
  settingsOverlay.hidden = false;
  // Force a style recalculation so the opacity transition runs from the hidden state.
  void settingsOverlay.offsetWidth;
  settingsOverlay.classList.add('open');
  document.getElementById('key-openai').focus();
}

function closeSettings() {
  settingsOverlay.classList.remove('open');
  const finish = () => {
    settingsOverlay.hidden = true;
    settingsOverlay.removeEventListener('transitionend', finish);
  };
  settingsOverlay.addEventListener('transitionend', finish);
  // Fallback in case transitionend never fires (e.g. reduced motion).
  setTimeout(finish, 300);
}

settingsBtn.addEventListener('click', openSettings);
settingsCancel.addEventListener('click', closeSettings);
settingsCloseBtn.addEventListener('click', closeSettings);

settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeSettings();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsOverlay.hidden) closeSettings();
});

settingsSave.addEventListener('click', () => {
  const settings = {};
  for (const p of PROVIDERS) {
    const apiKey = document.getElementById(`key-${p}`).value.trim();
    const model = document.getElementById(`model-${p}`).value.trim();
    if (apiKey || model) settings[p] = { apiKey, model };
  }
  saveSettings(settings);
  closeSettings();
  updateKeyStatus();
  setStatus('Đã lưu cài đặt API key vào trình duyệt.', 'success');
});

settingsClear.addEventListener('click', () => {
  if (!confirm('Xóa toàn bộ API key đã lưu trong trình duyệt này?')) return;
  localStorage.removeItem(STORAGE_KEY);
  fillSettingsForm();
  updateKeyStatus();
});

providerSelect.addEventListener('change', updateKeyStatus);

// ---- File dropzone ----

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function refreshFileChip() {
  const file = fileInput.files[0];
  if (file) {
    fileChipName.textContent = file.name;
    fileChipSize.textContent = formatSize(file.size);
    fileChip.hidden = false;
  } else {
    fileChip.hidden = true;
  }
}

fileInput.addEventListener('change', refreshFileChip);

fileRemoveBtn.addEventListener('click', () => {
  fileInput.value = '';
  refreshFileChip();
});

['dragenter', 'dragover'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  })
);

['dragleave', 'drop'].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  })
);

dropzone.addEventListener('drop', (e) => {
  const files = e.dataTransfer?.files;
  if (files?.length) {
    fileInput.files = files;
    refreshFileChip();
  }
});

// ---- Translate form ----

function setStatus(message, kind) {
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`;
}

async function loadLanguages() {
  const res = await fetch('/api/languages');
  const languages = await res.json();
  for (const lang of languages) {
    sourceSelect.add(new Option(lang.name, lang.code));
  }
  for (const lang of languages.filter((l) => l.code !== 'auto')) {
    targetSelect.add(new Option(lang.name, lang.code));
  }
  sourceSelect.value = 'auto';
  targetSelect.value = 'vi';
}

// ---- Result preview ----

let resultUrl = null;
let resultFilename = 'translated-document';

function clearResult() {
  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }
  resultPreview.innerHTML = '';
  resultEl.hidden = true;
}

function showResult(blob, filename) {
  clearResult();
  resultUrl = URL.createObjectURL(blob);
  resultFilename = filename;
  resultName.textContent = filename;
  resultSize.textContent = formatSize(blob.size);

  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    const frame = document.createElement('iframe');
    frame.src = resultUrl;
    frame.title = `Xem trước ${filename}`;
    resultPreview.appendChild(frame);
  } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif'].includes(ext)) {
    const img = document.createElement('img');
    img.src = resultUrl;
    img.alt = `Xem trước ${filename}`;
    resultPreview.appendChild(img);
  } else {
    // DOCX and other formats have no native browser preview.
    const note = document.createElement('div');
    note.className = 'result-note';
    note.innerHTML =
      '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
      '<span>Trình duyệt không xem trước được định dạng này — bấm "Tải xuống" để mở bằng Word.</span>';
    resultPreview.appendChild(note);
  }

  resultEl.hidden = false;
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function downloadResult() {
  if (!resultUrl) return;
  const a = document.createElement('a');
  a.href = resultUrl;
  a.download = resultFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

resultDownload.addEventListener('click', downloadResult);
resultClose.addEventListener('click', clearResult);

function filenameFromDisposition(header) {
  if (!header) return 'translated-document';
  const match = /filename="?([^"]+)"?/.exec(header);
  return match ? decodeURIComponent(match[1]) : 'translated-document';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    setStatus('Vui lòng chọn tài liệu cần dịch trước.', 'error');
    dropzone.focus?.();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  setStatus('Đang xử lý tài liệu — quá trình này có thể mất từ vài giây đến vài phút tùy độ dài file...', 'info');

  try {
    const formData = new FormData(form);
    const settings = loadSettings();
    const providerConfig = settings[providerSelect.value];
    if (providerConfig?.apiKey) formData.set('apiKey', providerConfig.apiKey);
    if (providerConfig?.model) formData.set('model', providerConfig.model);

    const res = await fetch('/api/translate', { method: 'POST', body: formData });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Đã xảy ra lỗi không xác định' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const filename = filenameFromDisposition(res.headers.get('Content-Disposition'));
    showResult(blob, filename);

    setStatus(`Hoàn tất! Xem trước kết quả bên dưới hoặc bấm "Tải xuống".`, 'success');
  } catch (err) {
    setStatus(`Lỗi: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
  }
});

loadLanguages();
updateKeyStatus();
