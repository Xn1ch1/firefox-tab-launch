const ICON_OPTIONS = [];

let FULL_ICON_OPTIONS = null;

async function loadFullMaterialIcons() {
    if (FULL_ICON_OPTIONS) return FULL_ICON_OPTIONS;
    try {
        // Load bundled icon index (local JSON) to avoid runtime network fetches.
        const res = await fetch(new URL('./icon-index.json', import.meta.url).href);
        if (!res.ok) throw new Error(`Failed to load bundled icon index: ${res.status}`);
        const names = await res.json();
        const set = new Set(ICON_OPTIONS.concat(names || []));
        FULL_ICON_OPTIONS = Array.from(set);
        return FULL_ICON_OPTIONS;
    } catch (err) {
        console.error('Failed to load full icon index:', err);
        FULL_ICON_OPTIONS = ICON_OPTIONS.slice();
        return FULL_ICON_OPTIONS;
    }
}

let _panel = null;
let _modalBox = null;
let _search = null;
let _list = null;
let _loadFullWrap = null;
let _loadFullBtn = null;
let _cancelBtn = null;
/** @type {{ wrapper: HTMLElement, glyph: HTMLElement, label: HTMLElement, isCategory: boolean } | null} */
let _currentPicker = null;

function _escHandler(e) {
    if (e.key === 'Escape') _closePanel();
}

function _createClearItem() {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'icon-option';
    item.dataset.value = '';
    const spanLabel = document.createElement('span');
    spanLabel.className = 'icon-option-label';
    spanLabel.textContent = 'Default';
    item.appendChild(spanLabel);
    item.addEventListener('click', () => {
        if (!_currentPicker) return;
        const { wrapper, glyph, label, isCategory } = _currentPicker;
        wrapper.dataset.value = '';
        glyph.textContent = isCategory ? 'folder' : 'open_in_new';
        label.textContent = isCategory ? 'Default icon' : 'None';
        _closePanel();
        wrapper.dispatchEvent(new Event('change'));
    });
    return item;
}

function _createIconItem(name) {
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
    item.addEventListener('click', () => {
        if (!_currentPicker) return;
        const { wrapper, glyph, label } = _currentPicker;
        wrapper.dataset.value = name;
        glyph.textContent = name;
        label.textContent = name;
        _closePanel();
        wrapper.dispatchEvent(new Event('change'));
    });
    return item;
}

async function _ensureFullList() {
    const all = await loadFullMaterialIcons();
    _list.innerHTML = '';
    _list.appendChild(_createClearItem());
    all.forEach((name) => _list.appendChild(_createIconItem(name)));
}

function _buildPanel() {
    if (_panel) return;

    _panel = document.createElement('div');
    _panel.className = 'icon-picker-panel';
    _panel.style.display = 'none';
    _panel.addEventListener('click', (e) => {
        if (e.target === _panel) _closePanel();
    });

    _modalBox = document.createElement('div');
    _modalBox.className = 'icon-picker-modal-box';

    const header = document.createElement('div');
    header.className = 'icon-picker-modal-header';
    const title = document.createElement('h3');
    title.textContent = 'Select Icon';
    _cancelBtn = document.createElement('button');
    _cancelBtn.type = 'button';
    _cancelBtn.className = 'icon-picker-cancel';
    _cancelBtn.textContent = 'Cancel';
    _cancelBtn.addEventListener('click', () => _closePanel());
    header.appendChild(title);
    header.appendChild(_cancelBtn);
    _modalBox.appendChild(header);

    _search = document.createElement('input');
    _search.type = 'search';
    _search.placeholder = 'Search icons...';
    _search.className = 'icon-picker-search';
    _modalBox.appendChild(_search);

    const _listParent = document.createElement('div');
    _listParent.className = 'icon-picker-list-parent';

    _list = document.createElement('div');
    _list.className = 'icon-picker-list';
    _list.appendChild(_createClearItem());
    ICON_OPTIONS.forEach((name) => _list.appendChild(_createIconItem(name)));

    _listParent.appendChild(_list);
    _modalBox.appendChild(_listParent);

    _loadFullWrap = document.createElement('div');
    _loadFullWrap.className = 'icon-load-full-wrap';
    _loadFullWrap.style.display = 'none';
    _loadFullBtn = document.createElement('button');
    _loadFullBtn.type = 'button';
    _loadFullBtn.className = 'icon-load-full-btn';
    _loadFullBtn.textContent = 'Load full icon list';
    _loadFullWrap.appendChild(_loadFullBtn);
    _modalBox.appendChild(_loadFullWrap);

    _panel.appendChild(_modalBox);

    _search.addEventListener('input', () => {
        const q = (_search.value || '').trim().toLowerCase();
        Array.from(_list.children).forEach((btn) => {
            const val = ((btn.dataset.value || '') + ' ' + (btn.textContent || '')).toLowerCase();
            btn.style.display = (!q || val.includes(q)) ? '' : 'none';
        });
        const visible = Array.from(_list.children).filter((c) => c.style.display !== 'none');
        if (visible.length === 0 && !FULL_ICON_OPTIONS) {
            _loadFullWrap.style.display = '';
        }
    });

    _loadFullBtn.addEventListener('click', (e) => {
        e.preventDefault();
        _loadFullBtn.disabled = true;
        const loading = document.createElement('div');
        loading.className = 'icon-loading';
        loading.textContent = 'Loading icons...';
        _modalBox.appendChild(loading);
        _ensureFullList().then(() => {
            loading.remove();
            _loadFullWrap.style.display = 'none';
            _loadFullBtn.disabled = false;
        }).catch(() => {
            loading.remove();
            _loadFullBtn.disabled = false;
        });
    });
}

function _openPanel(pickerInfo, buttonEl) {
    _buildPanel();
    _currentPicker = pickerInfo;

    _search.value = '';
    Array.from(_list.children).forEach((btn) => { btn.style.display = ''; });
    _loadFullWrap.style.display = 'none';

    if (!document.body.contains(_panel)) {
        document.body.appendChild(_panel);
    }

    _panel.style.display = 'flex';
    document.body.classList.add('no-scroll');
    document.addEventListener('keydown', _escHandler);
    _search.focus();

    if (!FULL_ICON_OPTIONS) {
        const loading = document.createElement('div');
        loading.className = 'icon-loading';
        loading.textContent = 'Loading icons...';
        _modalBox.appendChild(loading);
        _ensureFullList().then(() => {
            loading.remove();
            _loadFullWrap.style.display = 'none';
        }).catch(() => loading.remove());
    }
}

function _closePanel() {
    if (!_panel) return;
    try {
        if (document.body.contains(_panel)) document.body.removeChild(_panel);
    } catch (e) { /* ignore */ }
    _panel.style.display = 'none';
    document.removeEventListener('keydown', _escHandler);
    document.body.classList.remove('no-scroll');
    _currentPicker = null;
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

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (_currentPicker && _currentPicker.wrapper === wrapper && _panel && _panel.style.display === 'flex') {
            _closePanel();
        } else {
            _openPanel({ wrapper, glyph, label, isCategory }, button);
        }
    });

    return wrapper;
}

export { createIconPicker, loadFullMaterialIcons, ICON_OPTIONS };

