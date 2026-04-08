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
        list.innerHTML = '';
        addClearOption();
        all.forEach((name) => addIconOption(name));
    }

    panel.appendChild(list);
    wrapper.appendChild(panel);

    // Optional load-full control for users who want the complete icon list
    const loadFullWrap = document.createElement('div');
    loadFullWrap.className = 'icon-load-full-wrap';
    loadFullWrap.style.display = 'none';
    const loadFullBtn = document.createElement('button');
    loadFullBtn.type = 'button';
    loadFullBtn.className = 'icon-load-full-btn';
    loadFullBtn.textContent = 'Load full icon list';
    loadFullWrap.appendChild(loadFullBtn);
    panel.appendChild(loadFullWrap);

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
                loadFullWrap.style.display = 'none';
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

        // If the user searched and there are no visible matches, try loading the
        // full icon index (lazy fetch). This gives a way to surface more icons
        // without forcing the fetch on every open.
        const visible = Array.from(list.children).filter((c) => c.style.display !== 'none');
        if (visible.length === 0 && !FULL_ICON_OPTIONS) {
            // show a load button to avoid surprising network activity
            loadFullWrap.style.display = '';
        }
    });

    // Click handler for the explicit "Load full icon list" button
    loadFullBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadFullBtn.disabled = true;
        const loading = document.createElement('div');
        loading.className = 'icon-loading';
        loading.textContent = 'Loading icons...';
        panel.appendChild(loading);
        ensureFullList().then(() => {
            loading.remove();
            loadFullWrap.style.display = 'none';
            loadFullBtn.disabled = false;
        }).catch(() => {
            loading.remove();
            loadFullBtn.disabled = false;
        });
    });

    if (selected) {
        glyph.textContent = selected;
        label.textContent = selected;
    }

    return wrapper;
}

export { createIconPicker, loadFullMaterialIcons, ICON_OPTIONS };

