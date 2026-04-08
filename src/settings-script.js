import { getLinksJSON, saveLinks, getDefaultLinksExample } from './storage.js';
import { getThemeMode, applyTheme, watchSystemThemeChanges, saveThemeMode } from './theme.js';
import { renderLinksInto } from './render.js';
import * as builder from './builder.js';

const jsonInput = document.getElementById('json-input');
const settingsForm = document.getElementById('settings-form');
const statusAlert = document.getElementById('status-alert');
const loadExampleBtn = document.getElementById('load-example-btn');
const themeModeSelect = document.getElementById('theme-mode');
const toggleBuilderBtn = document.getElementById('toggle-builder');
const toggleJsonBtn = document.getElementById('toggle-json');
const builderContainer = document.getElementById('builder-container');
const jsonContainer = document.getElementById('json-container');
const categoriesList = document.getElementById('categories-list');
const addCategoryBtn = document.getElementById('add-category-btn');
const restoreStorageBtn = document.getElementById('restore-storage-btn');
const exportJsonBtn = document.getElementById('export-json-btn');
const previewModal = document.getElementById('preview-modal');
const previewModalArea = document.getElementById('preview-modal-area');
const openPreviewBtn = document.getElementById('open-preview-btn');
const previewCloseBtn = document.getElementById('preview-close-btn');
const iconHelpBox = document.getElementById('icon-help');

let stopThemeWatcher = () => {};
let currentView = 'json'; // 'json' or 'builder'

function showAlert(message, type = 'success') {
    statusAlert.textContent = message;
    statusAlert.className = `alert show alert-${type}`;
    setTimeout(() => {
        statusAlert.classList.remove('show');
    }, 5000);
}

function formatJSON(jsonString) {
    try {
        return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch (error) {
        console.error('Failed to pretty-print JSON:', error);
        return jsonString;
    }
}

function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

const updatePreviewFromBuilder = debounce(() => {
    try {
        const data = builder.getBuilderData();
        if (previewModalArea) {
            renderLinksInto(previewModalArea, data);
        }
    } catch (err) {
        console.error('Preview update failed:', err);
    }
}, 200);

function openPreviewModal() {
    if (!previewModal) return;
    updatePreviewFromBuilder();
    previewModal.style.display = 'block';
    if (previewCloseBtn) previewCloseBtn.focus();
    document.addEventListener('keydown', previewEscHandler);
}

function closePreviewModal() {
    if (!previewModal) return;
    previewModal.style.display = 'none';
    document.removeEventListener('keydown', previewEscHandler);
}

function previewEscHandler(e) {
    if (e.key === 'Escape') {
        closePreviewModal();
    }
}

if (openPreviewBtn) openPreviewBtn.addEventListener('click', openPreviewModal);
if (previewCloseBtn) previewCloseBtn.addEventListener('click', closePreviewModal);
if (previewModal) previewModal.addEventListener('click', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('modal-backdrop')) {
        closePreviewModal();
    }
});

builder.init({categoriesList, updatePreview: updatePreviewFromBuilder});

async function loadSettings() {
    const json = await getLinksJSON();
    const themeMode = await getThemeMode();

    applySelectedTheme(themeMode);
    themeModeSelect.value = themeMode;

    if (json) {
        jsonInput.value = formatJSON(json);
    }

    try {
        builder.populateBuilderFromJSON(json || getDefaultLinksExample());
    } catch (err) {
        console.warn('Failed to populate builder on load:', err);
    }
}

function applySelectedTheme(themeMode) {
    stopThemeWatcher();
    const state = applyTheme(themeMode);
    stopThemeWatcher = watchSystemThemeChanges(state.mode);
}

settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    let json;
    if (currentView === 'builder') {
        const serialized = builder.serializeBuilderToJSON();
        if (!serialized) {
            return;
        }
        json = serialized;
        jsonInput.value = formatJSON(json);
    } else {
        json = jsonInput.value.trim();
    }

    if (!json) {
        showAlert('Please enter valid JSON configuration', 'error');
        return;
    }

    try {
        const result = await saveLinks(json);

        if (result.valid) {
            await loadSettings();
            showAlert(result.message || 'Configuration saved successfully!', 'success');
            console.log('Configuration saved:', result);
        } else {
            showAlert(`Validation error: ${result.error}`, 'error');
            console.error('Validation error:', result.error);
        }
    } catch (error) {
        console.error('Error during save:', error);
        showAlert(`Error: ${error.message}`, 'error');
    }
});

loadExampleBtn.addEventListener('click', () => {
    jsonInput.value = formatJSON(getDefaultLinksExample());
    showAlert('Example configuration loaded', 'success');
    if (currentView === 'builder') {
        builder.populateBuilderFromJSON(getDefaultLinksExample());
    }
});

function switchToBuilder() {
    if (currentView === 'builder') return;
    try {
        builder.populateBuilderFromJSON(jsonInput.value || getDefaultLinksExample());
    } catch (err) {
        console.error('Failed to parse JSON for builder:', err);
        showAlert('Invalid JSON — cannot open builder', 'error');
        return;
    }
    jsonContainer.style.display = 'none';
    builderContainer.style.display = 'block';
    toggleBuilderBtn.classList.add('active');
    toggleJsonBtn.classList.remove('active');
    if (iconHelpBox) iconHelpBox.style.display = 'none';
    currentView = 'builder';
}

function switchToJSON() {
    if (currentView === 'json') return;
    const serialized = builder.serializeBuilderToJSON();
    if (!serialized) return;
    jsonInput.value = formatJSON(serialized);
    builderContainer.style.display = 'none';
    jsonContainer.style.display = 'block';
    toggleBuilderBtn.classList.remove('active');
    toggleJsonBtn.classList.add('active');
    if (iconHelpBox) iconHelpBox.style.display = '';
    currentView = 'json';
}

toggleBuilderBtn.addEventListener('click', switchToBuilder);
toggleJsonBtn.addEventListener('click', switchToJSON);

addCategoryBtn.addEventListener('click', () => {
    categoriesList.appendChild(builder.createCategoryElement());
    updatePreviewFromBuilder();
});

restoreStorageBtn.addEventListener('click', async () => {
    try {
        const json = await getLinksJSON();
        if (!json) {
            showAlert('No stored configuration found', 'error');
            return;
        }
        builder.populateBuilderFromJSON(json);
        showAlert('Restored from storage', 'success');
    } catch (err) {
        console.error('Restore failed:', err);
        showAlert('Failed to restore from storage', 'error');
    }
});

exportJsonBtn.addEventListener('click', async () => {
    const serialized = builder.serializeBuilderToJSON();
    if (!serialized) return;
    try {
        await navigator.clipboard.writeText(formatJSON(serialized));
        showAlert('JSON copied to clipboard', 'success');
    } catch (err) {
        console.error('Copy failed:', err);
        showAlert('Failed to copy JSON to clipboard', 'error');
    }
});

themeModeSelect.addEventListener('change', async (event) => {
    const selectedMode = event.target.value;
    applySelectedTheme(selectedMode);

    const result = await saveThemeMode(selectedMode);
    if (result.valid) {
        showAlert('Theme preference saved', 'success');
    } else {
        showAlert(`Failed to save theme: ${result.error}`, 'error');
    }
});

loadSettings();

