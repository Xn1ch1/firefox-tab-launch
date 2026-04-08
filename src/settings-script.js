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

function getBuilderData() {
    const cats = [];
    const catNodes = Array.from(categoriesList.children);
    catNodes.forEach((cn) => {
        const header = cn.querySelector('.builder-category-header');
        const titleInput = header.querySelector('input[placeholder="Category title"]');
        const iconInput = header.querySelector('.icon-picker');
        const colorInput = header.querySelector('input[placeholder="color (optional, hex)"], input[type="color"]');

        const title = titleInput ? titleInput.value.trim() : '';
        const icon = iconInput ? (iconInput.dataset && iconInput.dataset.value ? iconInput.dataset.value.trim() : '') : '';
        const color = colorInput ? (colorInput.dataset && colorInput.dataset.empty === 'true' ? '' : (colorInput.value || '').trim()) : '';

        const links = [];
        const linkNodes = Array.from(cn.querySelectorAll('.builder-link'));
        linkNodes.forEach((ln) => {
            const inputs = ln.querySelectorAll('input');
            const lTitle = inputs[0] ? inputs[0].value.trim() : '';
            const lUrl = inputs[1] ? inputs[1].value.trim() : '';
            const lDesc = inputs[2] ? inputs[2].value.trim() : '';
            const iconPicker = ln.querySelector('.icon-picker');
            const lIcon = iconPicker ? (iconPicker.dataset.value || '').trim() : (inputs[3] ? inputs[3].value.trim() : '');

            const linkObj = {title: lTitle, url: lUrl};
            if (lDesc) linkObj.description = lDesc;
            if (lIcon) linkObj.icon = lIcon;
            links.push(linkObj);
        });

        const catObj = {title, links};
        if (icon) catObj.icon = icon;
        if (color) catObj.color = color;
        cats.push(catObj);
    });
    return cats;
}

const updatePreviewFromBuilder = debounce(() => {
    try {
        const data = getBuilderData();
        if (previewModalArea) {
            renderLinksInto(previewModalArea, data);
        }
    } catch (err) {
        console.error('Preview update failed:', err);
    }
}, 200);

function openPreviewModal() {
    if (!previewModal) return;
    // Ensure preview content is current
    updatePreviewFromBuilder();
    previewModal.style.display = 'block';
    // trap focus optionally - focus close button
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

async function loadSettings() {
    const json = await getLinksJSON();
    const themeMode = await getThemeMode();

    applySelectedTheme(themeMode);
    themeModeSelect.value = themeMode;

    if (json) {
        jsonInput.value = formatJSON(json);
    }

    try {
        populateBuilderFromJSON(json || getDefaultLinksExample());
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
        const serialized = serializeBuilderToJSON();
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
        populateBuilderFromJSON(getDefaultLinksExample());
    }
});

// Toggle view handlers
function switchToBuilder() {
    if (currentView === 'builder') return;
    try {
        populateBuilderFromJSON(jsonInput.value || getDefaultLinksExample());
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
    const serialized = serializeBuilderToJSON();
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

// Builder implementation
function clearBuilder() {
    categoriesList.innerHTML = '';
}

function createInput(placeholder, value = '', type = 'text') {
    const input = document.createElement('input');
    input.type = type;
    if (type === 'color') {
        if (value) {
            input.value = value;
            input.dataset.empty = 'false';
        } else {
            input.value = '#000000';
            input.dataset.empty = 'true';
        }
        input.addEventListener('input', () => {
            input.dataset.empty = 'false';
            input.classList.remove('color-empty');
            updatePreviewFromBuilder();
        });
    } else {
        input.placeholder = placeholder;
        input.value = value;
    }
    return input;
}

// Curated starter set of icons; full index can be loaded on demand
const ICON_OPTIONS = [
    'folder','open_in_new','mail','calendar_month','code','help','language','chat','forum','newspaper','play_circle','book','school','task_alt','database','description',
    'home','search','settings','favorite','star','link','visibility','visibility_off','account_circle','person','people','shopping_cart','calendar_today','event','info','warning','error','check_circle','close','logout','login','cloud','cloud_upload','cloud_download','download','upload','save','edit','delete','add','remove','share','more_vert','more_horiz','menu','arrow_back','arrow_forward','refresh','loop','build','developer_mode','bug_report','fingerprint','lock','lock_open','security','language','public','translate','phone','email','chat_bubble','comment','videocam','camera_alt','play_arrow','pause','stop','volume_up','volume_off','mic','mic_off','map','place','location_on','directions','navigation','train','flight','hotel','directions_car','directions_bike','directions_walk','bicycle','fitness_center','spa','palette','brush','image','photo','brightness_4','brightness_7','contrast','toggle_on','toggle_off','battery_full','battery_std','battery_charging_full','wifi','signal_wifi_4_bar','list','view_list','grid_view','apps','dashboard','timeline','schedule','alarm','timer','stopwatch','access_time','payment','attach_money','shopping_bag','local_offer','local_grocery_store','restaurant','local_cafe'
];

let FULL_ICON_OPTIONS = null;

async function loadFullMaterialIcons() {
    if (FULL_ICON_OPTIONS) return FULL_ICON_OPTIONS;
    try {
        const url = 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/codepoints';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch icons: ${res.status}`);
        const txt = await res.text();
        const names = txt.split(/\r?\n/).map(line => line.split(/\s+/)[0]).filter(Boolean);
        const set = new Set(ICON_OPTIONS.concat(names));
        FULL_ICON_OPTIONS = Array.from(set);
        return FULL_ICON_OPTIONS;
    } catch (err) {
        console.error('Failed to load full icon index:', err);
        FULL_ICON_OPTIONS = ICON_OPTIONS.slice();
        return FULL_ICON_OPTIONS;
    }
}

function createIconPicker(selected = '', isCategory = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'icon-picker';
    wrapper.tabIndex = -1;
    wrapper.dataset.value = selected || '';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-picker-button';

    const glyph = document.createElement('span');
    glyph.className = 'material-symbols-outlined icon-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.textContent = selected || 'folder';

    const label = document.createElement('span');
    label.className = 'icon-label';
    label.textContent = selected || (isCategory ? 'Default icon' : 'None');

    button.appendChild(glyph);
    button.appendChild(label);
    wrapper.appendChild(button);

    const panel = document.createElement('div');
    panel.className = 'icon-picker-panel';
    panel.style.display = 'none';

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search icons...';
    search.className = 'icon-picker-search';
    panel.appendChild(search);

    const list = document.createElement('div');
    list.className = 'icon-picker-list';

    function addIconOption(name) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'icon-option';
        item.dataset.value = name;

        const spanGlyph = document.createElement('span');
        spanGlyph.className = 'material-symbols-outlined';
        spanGlyph.setAttribute('aria-hidden', 'true');
        spanGlyph.textContent = name;
        const spanLabel = document.createElement('span');
        spanLabel.className = 'icon-option-label';
        spanLabel.textContent = name;

        item.appendChild(spanGlyph);
        item.appendChild(spanLabel);
        list.appendChild(item);

        item.addEventListener('click', () => {
            wrapper.dataset.value = name;
            glyph.textContent = name;
            label.textContent = name;
            closePanel();
            wrapper.dispatchEvent(new Event('change'));
        });
    }

    function addClearOption() {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'icon-option';
        // empty dataset.value signifies clearing
        item.dataset.value = '';

        const spanLabel = document.createElement('span');
        spanLabel.className = 'icon-option-label';
        spanLabel.textContent = 'Default';
        item.appendChild(spanLabel);
        list.appendChild(item);

        item.addEventListener('click', () => {
            wrapper.dataset.value = '';
            glyph.textContent = isCategory ? 'folder' : 'open_in_new';
            label.textContent = isCategory ? 'Default icon' : 'None';
            closePanel();
            wrapper.dispatchEvent(new Event('change'));
        });
    }

    addClearOption();
    ICON_OPTIONS.forEach((name) => addIconOption(name));

    async function ensureFullList() {
        const all = await loadFullMaterialIcons();
        // clear and repopulate if needed
        list.innerHTML = '';
        addClearOption();
        all.forEach((name) => addIconOption(name));
    }

    panel.appendChild(list);
    wrapper.appendChild(panel);

    function openPanel() {

        if (!document.body.contains(panel)) {
            document.body.appendChild(panel);
        }

        panel.style.display = 'block';
        panel.style.position = 'fixed';
        panel.style.visibility = 'hidden';

        document.body.classList.add('no-scroll');

        const rect = button.getBoundingClientRect();
        panel.style.left = '0px';
        panel.style.top = '0px';

        const panelRect = panel.getBoundingClientRect();
        const panelW = panelRect.width || 300;
        const panelH = panelRect.height || 300;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        let left = rect.left;
        let top = rect.bottom + 8;

        if (left + panelW > viewportW - 8) {
            left = Math.max(8, viewportW - panelW - 8);
        }
        if (top + panelH > viewportH - 8) {
            top = rect.top - panelH - 8;
            if (top < 8) top = 8;
        }

        panel.style.left = `${Math.round(left)}px`;
        panel.style.top = `${Math.round(top)}px`;
        panel.style.visibility = 'visible';

        search.focus();
        document.addEventListener('click', outsideClick);

        if (!FULL_ICON_OPTIONS) {
            const loading = document.createElement('div');
            loading.className = 'icon-loading';
            loading.textContent = 'Loading icons...';
            panel.appendChild(loading);
            ensureFullList().then(() => {
                loading.remove();
            }).catch(() => loading.remove());
        }
    }

    function closePanel() {
        try {
            if (document.body.contains(panel)) document.body.removeChild(panel);
        } catch (e) {
            // ignore
        }
        panel.style.display = 'none';
        document.removeEventListener('click', outsideClick);
        document.body.classList.remove('no-scroll');
    }
    function outsideClick(e) {
        if (!wrapper.contains(e.target)) closePanel();
    }

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (panel.style.display === 'block') closePanel(); else openPanel();
    });

    search.addEventListener('input', () => {
        const q = (search.value || '').trim().toLowerCase();
        Array.from(list.children).forEach((btn) => {
            const val = ((btn.dataset.value || '') + ' ' + (btn.textContent || '')).toLowerCase();
            btn.style.display = (!q || val.includes(q)) ? '' : 'none';
        });
    });

    if (selected) {
        glyph.textContent = selected;
        label.textContent = selected;
    }

    return wrapper;
}

function createLinkElement(linkData = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'builder-link';

    const title = createInput('Link title', linkData.title || '');
    const url = createInput('https://example.com', linkData.url || '');
    const description = createInput('Description (optional)', linkData.description || '');
    const icon = createIconPicker(linkData.icon || '');

    const btns = document.createElement('div');
    btns.className = 'builder-link-controls';

    const up = document.createElement('button'); up.type = 'button'; up.textContent = '↑'; up.title = 'Move up';
    const down = document.createElement('button'); down.type = 'button'; down.textContent = '↓'; down.title = 'Move down';
    const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Delete'; del.title = 'Delete link';

    btns.appendChild(up); btns.appendChild(down); btns.appendChild(del);

    wrapper.appendChild(title);
    wrapper.appendChild(url);
    wrapper.appendChild(description);
    wrapper.appendChild(icon);
    wrapper.appendChild(btns);

    up.addEventListener('click', () => {
        const parent = wrapper.parentElement;
        if (parent && wrapper.previousElementSibling) {
            parent.insertBefore(wrapper, wrapper.previousElementSibling);
        }
    });
    down.addEventListener('click', () => {
        const parent = wrapper.parentElement;
        if (parent && wrapper.nextElementSibling) {
            parent.insertBefore(wrapper.nextElementSibling, wrapper);
        }
    });
    del.addEventListener('click', () => wrapper.remove());

    [title, url, description].forEach((inp) => inp.addEventListener('input', updatePreviewFromBuilder));
    if (icon && icon.addEventListener) icon.addEventListener('change', updatePreviewFromBuilder);

    return wrapper;
}

function createCategoryElement(category = {}) {
    const card = document.createElement('div');
    card.className = 'builder-category';

    const header = document.createElement('div');
    header.className = 'builder-category-header';

    const title = createInput('Category title', category.title || '');
    const icon = createIconPicker(category.icon || '', true);
    const color = createInput('color (optional, hex)', category.color || '', 'color');

    if (category.color) {
        color.dataset.empty = 'false';
    } else {
        color.dataset.empty = 'true';
        color.classList.add('color-empty');
    }

    color.addEventListener('input', () => {
        color.dataset.empty = 'false';
        color.classList.remove('color-empty');
        if (colorClearBtn) colorClearBtn.style.display = 'inline-block';
        updatePreviewFromBuilder();
    });

    const colorClearBtn = document.createElement('button');
    colorClearBtn.type = 'button';
    colorClearBtn.className = 'color-clear-btn';
    colorClearBtn.title = 'Clear color';
    colorClearBtn.textContent = '✕';
    colorClearBtn.style.display = (color.dataset && color.dataset.empty === 'true') ? 'none' : 'inline-block';
    colorClearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        color.dataset.empty = 'true';
        color.classList.add('color-empty');
        colorClearBtn.style.display = 'none';
        updatePreviewFromBuilder();
    });

    const catControls = document.createElement('div');
    catControls.className = 'builder-category-controls';
    const up = document.createElement('button'); up.type = 'button'; up.textContent = '↑'; up.title = 'Move category up';
    const down = document.createElement('button'); down.type = 'button'; down.textContent = '↓'; down.title = 'Move category down';
    const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Delete';

    catControls.appendChild(up); catControls.appendChild(down); catControls.appendChild(del);

    header.appendChild(title);
    header.appendChild(icon);
    const colorWrap = document.createElement('div');
    colorWrap.className = 'color-wrap';
    colorWrap.appendChild(color);
    colorWrap.appendChild(colorClearBtn);
    header.appendChild(colorWrap);
    header.appendChild(catControls);

    const linksContainer = document.createElement('div');
    linksContainer.className = 'builder-links';

    (category.links || []).forEach((ln) => {
        linksContainer.appendChild(createLinkElement(ln));
    });

    const addLinkBtn = document.createElement('button');
    addLinkBtn.type = 'button';
    addLinkBtn.textContent = 'Add link';
    addLinkBtn.className = 'builder-add-link-btn';
    addLinkBtn.addEventListener('click', () => {
        linksContainer.appendChild(createLinkElement());
        updatePreviewFromBuilder();
        const last = linksContainer.lastElementChild;
        if (last) {
            const input = last.querySelector('input');
            if (input) input.focus();
        }
    });

    [title, /* icon select handled below */, color].forEach((inp) => inp.addEventListener('input', updatePreviewFromBuilder));
    if (icon && icon.addEventListener) icon.addEventListener('change', updatePreviewFromBuilder);

    up.addEventListener('click', () => {
        if (card.previousElementSibling) {
            categoriesList.insertBefore(card, card.previousElementSibling);
        }
    });
    down.addEventListener('click', () => {
        if (card.nextElementSibling) {
            categoriesList.insertBefore(card.nextElementSibling, card);
        }
    });
    del.addEventListener('click', () => card.remove());

    card.appendChild(header);
    card.appendChild(linksContainer);
    card.appendChild(addLinkBtn);
    return card;
}

function populateBuilderFromJSON(jsonString) {
    clearBuilder();
    let parsed;
    try {
        parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (err) {
        throw new Error('Invalid JSON provided to builder');
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Builder expects an array of categories');
    }

    parsed.forEach((cat) => {
        categoriesList.appendChild(createCategoryElement(cat));
    });
    updatePreviewFromBuilder();
}

function serializeBuilderToJSON() {
    const cats = [];
    const catNodes = Array.from(categoriesList.children);
    catNodes.forEach((cn, catIndex) => {
        const header = cn.querySelector('.builder-category-header');
        const titleInput = header.querySelector('input[placeholder="Category title"]');
        const iconInput = header.querySelector('.icon-picker');
        const colorInput = header.querySelector('input[placeholder="color (optional, hex)"], input[type="color"]');

        const title = titleInput ? titleInput.value.trim() : '';
        const icon = iconInput ? (iconInput.dataset.value || '').trim() : '';
        const color = colorInput ? (colorInput.dataset && colorInput.dataset.empty === 'true' ? '' : (colorInput.value || '').trim()) : '';

        const links = [];
        const linkNodes = Array.from(cn.querySelectorAll('.builder-link'));
        linkNodes.forEach((ln, linkIndex) => {
            const inputs = ln.querySelectorAll('input');
            const lTitle = inputs[0] ? inputs[0].value.trim() : '';
            const lUrl = inputs[1] ? inputs[1].value.trim() : '';
            const lDesc = inputs[2] ? inputs[2].value.trim() : '';
            const iconPicker = ln.querySelector('.icon-picker');
            const lIcon = iconPicker ? (iconPicker.dataset.value || '').trim() : (inputs[3] ? inputs[3].value.trim() : '');

            const linkObj = {title: lTitle, url: lUrl};
            if (lDesc) linkObj.description = lDesc;
            if (lIcon) linkObj.icon = lIcon;
            links.push(linkObj);
        });

        const catObj = {title, links};
        if (icon) catObj.icon = icon;
        if (color) catObj.color = color;
        cats.push(catObj);
    });

    const jsonString = JSON.stringify(cats, null, 2);
    const validation = validateLinksJSON(jsonString);
    if (!validation.valid) {
        showAlert(`Validation error: ${validation.error}`, 'error');
        return null;
    }

    return jsonString;
}

addCategoryBtn.addEventListener('click', () => {
    categoriesList.appendChild(createCategoryElement());
    updatePreviewFromBuilder();
});

restoreStorageBtn.addEventListener('click', async () => {
    try {
        const json = await getLinksJSON();
        if (!json) {
            showAlert('No stored configuration found', 'error');
            return;
        }
        populateBuilderFromJSON(json);
        showAlert('Restored from storage', 'success');
    } catch (err) {
        console.error('Restore failed:', err);
        showAlert('Failed to restore from storage', 'error');
    }
});

exportJsonBtn.addEventListener('click', async () => {
    const serialized = serializeBuilderToJSON();
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

