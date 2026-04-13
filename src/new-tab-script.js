import { getLinks, getShowUrls } from './storage.js';
import { getThemeMode, applyTheme, watchSystemThemeChanges } from './theme.js';
import { renderLinksInto } from './render.js';

let links = [];
let showUrls = false;
let stopThemeWatcher = () => {};

async function loadLinks() {
    showUrls = await getShowUrls();
    const storedLinks = await getLinks();
    if (storedLinks) {
        links = storedLinks;
        renderLinks(links);
    } else {
        renderLinks([]);
    }
}

function filterLinks(categories, rawQuery) {
    const query = (rawQuery || '').trim().toLowerCase();
    if (!query) {
        return categories;
    }

    return (categories || []).map((category) => {
        const categoryMatches = (category.title || '').toLowerCase().includes(query);
        const matchedLinks = (category.links || []).filter((item) => {
            const haystack = [item.title, item.description, item.url]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return categoryMatches || haystack.includes(query);
        });

        return {
            ...category,
            links: matchedLinks,
        };
    }).filter((category) => (category.links || []).length > 0);
}

let activeResultIndex = -1;

function getRenderedLinks() {
    return Array.from(document.querySelectorAll('.link-button'));
}

function setActiveResult(index, options = {}) {
    const shouldScroll = options.scroll !== false;
    const results = getRenderedLinks();

    results.forEach((node) => node.classList.remove('is-active'));
    if (results.length === 0) {
        activeResultIndex = -1;
        return;
    }

    const normalized = (index + results.length) % results.length;
    activeResultIndex = normalized;
    results[normalized].classList.add('is-active');
    if (shouldScroll) {
        results[normalized].scrollIntoView({block: 'nearest'});
    }
}

function setActiveByElement(element, options = {}) {
    const results = getRenderedLinks();
    const index = results.indexOf(element);
    if (index !== -1) {
        setActiveResult(index, options);
    }
}

function renderLinks(categories, query) {
    const categoryList = document.getElementById('category-list');
    const subtitle = document.getElementById('subtitle');
    categoryList.innerHTML = '';
    activeResultIndex = -1;

    if (!Array.isArray(categories) || categories.length === 0) {
        subtitle.style.display = 'block';
        categoryList.innerHTML = '<p class="empty-state">No links configured yet. <a href="#" id="goto-settings-link" style="color: var(--primary); text-decoration: none;">Open settings</a> to add links.</p>';
        document.getElementById('goto-settings-link').addEventListener('click', (e) => {
            e.preventDefault();
            browser.runtime.openOptionsPage();
        });
        return;
    }

    subtitle.style.display = 'none';
    const filteredCategories = filterLinks(categories, query);
    if (filteredCategories.length === 0) {
        categoryList.innerHTML = '<p class="empty-state">No matching links found.</p>';
        return;
    }

    renderLinksInto(categoryList, filteredCategories, { showUrls });

    const trimmedQuery = (query || '').trim();
    if (trimmedQuery) {
        setActiveResult(0, {scroll: false});
    }
}

const searchInput = document.getElementById('search-input');
const categoryList = document.getElementById('category-list');
const settingsButton = document.getElementById('settings-button');

searchInput.addEventListener('input', (event) => {
    renderLinks(links, event.target.value);
});

searchInput.addEventListener('keydown', (event) => {
    const results = getRenderedLinks();

    if (event.key === 'Escape') {
        if (searchInput.value) {
            event.preventDefault();
            searchInput.value = '';
            renderLinks(links, '');
        }
        return;
    }

    if (event.key === 'ArrowDown') {
        if (results.length === 0) {
            return;
        }
        event.preventDefault();
        setActiveResult(activeResultIndex + 1);
        return;
    }

    if (event.key === 'ArrowUp') {
        if (results.length === 0) {
            return;
        }
        event.preventDefault();
        if (activeResultIndex === -1) {
            setActiveResult(results.length - 1);
        } else {
            setActiveResult(activeResultIndex - 1);
        }
        return;
    }

    if (event.key === 'Enter') {
        if (results.length === 0) {
            return;
        }
        event.preventDefault();

        if (activeResultIndex === -1) {
            setActiveResult(0, {scroll: false});
        }

        const selected = getRenderedLinks()[activeResultIndex];
        if (selected) {
            selected.click();
        }
    }
});

categoryList.addEventListener('mouseover', (event) => {
    const hoveredLink = event.target.closest('.link-button');
    if (hoveredLink) {
        setActiveByElement(hoveredLink, {scroll: false});
    }
});

categoryList.addEventListener('focusin', (event) => {
    const focusedLink = event.target.closest('.link-button');
    if (focusedLink) {
        setActiveByElement(focusedLink, {scroll: false});
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }

    const target = event.target;
    const tagName = target && target.tagName ? target.tagName.toLowerCase() : '';
    const isEditable = target && (target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select');

    if (isEditable) {
        return;
    }

    event.preventDefault();
    searchInput.focus();
    searchInput.select();
});

settingsButton.addEventListener('click', (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
});

async function initializeTheme() {
    const themeMode = await getThemeMode();
    const state = applyTheme(themeMode);
    stopThemeWatcher = watchSystemThemeChanges(state.mode);
}

async function initializePage() {
    await initializeTheme();
    await loadLinks();
    // Try to focus the search input. When the new tab is opened the browser
    // sometimes keeps focus on the address bar, so wait for the window to be
    // focused before forcing input focus. Use a small timeout as a fallback.
    try {
        if (document.hasFocus && !document.hasFocus()) {
            window.addEventListener('focus', function onWinFocus() {
                searchInput.focus();
                try { searchInput.select(); } catch (e) { /* ignore */ }
            }, {once: true});
            setTimeout(() => {
                try { searchInput.focus(); searchInput.select(); } catch (e) {}
            }, 100);
        } else {
            setTimeout(() => { try { searchInput.focus(); searchInput.select(); } catch (e) {} }, 10);
        }
    } catch (err) {
        try { searchInput.focus(); searchInput.select(); } catch (e) {}
    }
}

initializePage();

