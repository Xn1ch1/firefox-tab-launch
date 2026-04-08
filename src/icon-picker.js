// Icon picker component (material symbols)

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

export { createIconPicker, loadFullMaterialIcons, ICON_OPTIONS };

