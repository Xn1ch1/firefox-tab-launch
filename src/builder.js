import { createIconPicker } from './icon-picker.js';

let categoriesListRef = null;
let updatePreviewRef = null;

export function init({categoriesList, updatePreview}) {
    categoriesListRef = categoriesList;
    updatePreviewRef = updatePreview;
}

export function clearBuilder() {
    if (!categoriesListRef) return;
    categoriesListRef.innerHTML = '';
}

export function createInput(placeholder, value = '', type = 'text') {
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
            if (typeof updatePreviewRef === 'function') updatePreviewRef();
        });
    } else {
        input.placeholder = placeholder;
        input.value = value;
    }
    return input;
}

export function getBuilderData() {
    const cats = [];
    if (!categoriesListRef) return cats;

    const catNodes = Array.from(categoriesListRef.children);
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

export function createLinkElement(linkData = {}) {
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

    [title, url, description].forEach((inp) => inp.addEventListener('input', () => { if (typeof updatePreviewRef === 'function') updatePreviewRef(); }));
    if (icon && icon.addEventListener) icon.addEventListener('change', () => { if (typeof updatePreviewRef === 'function') updatePreviewRef(); });

    return wrapper;
}

export function createCategoryElement(category = {}) {
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
        updatePreviewRef && updatePreviewRef();
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
        updatePreviewRef && updatePreviewRef();
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
        updatePreviewRef && updatePreviewRef();
        const last = linksContainer.lastElementChild;
        if (last) {
            const input = last.querySelector('input');
            if (input) input.focus();
        }
    });

    [title, color].forEach((inp) => inp.addEventListener('input', () => { if (typeof updatePreviewRef === 'function') updatePreviewRef(); }));
    if (icon && icon.addEventListener) icon.addEventListener('change', () => { if (typeof updatePreviewRef === 'function') updatePreviewRef(); });

    up.addEventListener('click', () => {
        if (card.previousElementSibling) {
            categoriesListRef.insertBefore(card, card.previousElementSibling);
        }
    });
    down.addEventListener('click', () => {
        if (card.nextElementSibling) {
            categoriesListRef.insertBefore(card.nextElementSibling, card);
        }
    });
    del.addEventListener('click', () => card.remove());

    card.appendChild(header);
    card.appendChild(linksContainer);
    card.appendChild(addLinkBtn);
    return card;
}

export function populateBuilderFromJSON(jsonString) {
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
        categoriesListRef.appendChild(createCategoryElement(cat));
    });
    updatePreviewRef && updatePreviewRef();
}

export function serializeBuilderToJSON() {
    const cats = [];
    const catNodes = Array.from(categoriesListRef.children);
    catNodes.forEach((cn) => {
        const header = cn.querySelector('.builder-category-header');
        const titleInput = header.querySelector('input[placeholder="Category title"]');
        const iconInput = header.querySelector('.icon-picker');
        const colorInput = header.querySelector('input[placeholder="color (optional, hex)"], input[type="color"]');

        const title = titleInput ? titleInput.value.trim() : '';
        const icon = iconInput ? (iconInput.dataset.value || '').trim() : '';
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

    return JSON.stringify(cats, null, 2);
}

