function validateLinksJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);

        if (!Array.isArray(data)) {
            throw new Error('Links data must be an array of categories');
        }

        if (data.length === 0) {
            throw new Error('At least one category is required');
        }

        data.forEach((category, catIndex) => {
            if (!category.title || typeof category.title !== 'string') {
                throw new Error(`Category ${catIndex + 1}: 'title' is required and must be a string`);
            }

            if (!Array.isArray(category.links)) {
                throw new Error(`Category ${catIndex + 1}: 'links' must be an array`);
            }

            if (category.links.length === 0) {
                throw new Error(`Category ${catIndex + 1}: Must have at least one link`);
            }

            category.links.forEach((link, linkIndex) => {
                if (!link.title || typeof link.title !== 'string') {
                    throw new Error(`Category ${catIndex + 1}, Link ${linkIndex + 1}: 'title' is required and must be a string`);
                }

                if (!link.url || typeof link.url !== 'string') {
                    throw new Error(`Category ${catIndex + 1}, Link ${linkIndex + 1}: 'url' is required and must be a string`);
                }

                // Validate URL format
                try {
                    new URL(link.url);
                } catch {
                    throw new Error(`Category ${catIndex + 1}, Link ${linkIndex + 1}: 'url' is not a valid URL`);
                }

                if (link.description && typeof link.description !== 'string') {
                    throw new Error(`Category ${catIndex + 1}, Link ${linkIndex + 1}: 'description' must be a string`);
                }

                if (link.icon && typeof link.icon !== 'string') {
                    throw new Error(`Category ${catIndex + 1}, Link ${linkIndex + 1}: 'icon' must be a string`);
                }

                if (link.color && typeof link.color !== 'string') {
                    throw new Error(`Category ${catIndex + 1}, Link ${linkIndex + 1}: 'color' must be a string`);
                }
            });
        });

        return { valid: true, data };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

async function saveLinks(jsonString) {
    const validation = validateLinksJSON(jsonString);
    if (!validation.valid) {
        console.error('Validation failed:', validation.error);
        return validation;
    }

    try {
        const storageData = {
            linksJSON: jsonString,
            lastUpdated: new Date().toISOString()
        };

        // Try sync storage first, fall back to local
        try {
            await browser.storage.sync.set(storageData);
            console.log('Successfully saved to sync storage');
        } catch (syncError) {
            console.warn('Sync storage failed, falling back to local:', syncError);
            await browser.storage.local.set(storageData);
            console.log('Successfully saved to local storage');
        }

        return { valid: true, message: 'Links saved successfully' };
    } catch (error) {
        console.error('Save failed:', error);
        return { valid: false, error: `Failed to save: ${error.message}` };
    }
}

async function getLinks() {
    try {
        let result;

        // Try sync storage first, fall back to local
        try {
            result = await browser.storage.sync.get('linksJSON');
        } catch (syncError) {
            console.warn('Sync storage read failed, trying local:', syncError);
            result = await browser.storage.local.get('linksJSON');
        }

        if (result.linksJSON) {
            const validation = validateLinksJSON(result.linksJSON);
            if (validation.valid) {
                return validation.data;
            }
        }
        return null;
    } catch (error) {
        console.error('Failed to retrieve links:', error);
        return null;
    }
}

async function getLinksJSON() {
    try {
        let result;

        // Try sync storage first, fall back to local
        try {
            result = await browser.storage.sync.get('linksJSON');
        } catch (syncError) {
            console.warn('Sync storage read failed, trying local:', syncError);
            result = await browser.storage.local.get('linksJSON');
        }

        return result.linksJSON || '';
    } catch (error) {
        console.error('Failed to retrieve links JSON:', error);
        return '';
    }
}

function getDefaultLinksExample() {
    return JSON.stringify([
        {
            title: 'Productivity',
            icon: 'task_alt',
            color: '#4ecdc4',
            links: [
                {
                    title: 'Gmail',
                    description: 'Email inbox',
                    url: 'https://mail.google.com',
                    icon: 'mail'
                },
                {
                    title: 'Google Calendar',
                    description: 'Schedule and events',
                    url: 'https://calendar.google.com',
                    icon: 'calendar_month'
                },
                {
                    title: 'Google Drive',
                    description: 'Files and documents',
                    url: 'https://drive.google.com',
                    icon: 'folder'
                }
            ]
        },
        {
            title: 'Development',
            icon: 'code',
            color: '#b39bff',
            links: [
                {
                    title: 'GitHub',
                    description: 'Version control and repositories',
                    url: 'https://github.com',
                    icon: 'code'
                },
                {
                    title: 'Stack Overflow',
                    description: 'Programming Q&A',
                    url: 'https://stackoverflow.com',
                    icon: 'help'
                },
                {
                    title: 'MDN Web Docs',
                    description: 'Web development documentation',
                    url: 'https://developer.mozilla.org',
                    icon: 'description'
                }
            ]
        },
        {
            title: 'Social & News',
            icon: 'language',
            color: '#ff9999',
            links: [
                {
                    title: 'Twitter',
                    description: 'Social media',
                    url: 'https://twitter.com',
                    icon: 'chat'
                },
                {
                    title: 'Reddit',
                    description: 'Community discussions',
                    url: 'https://reddit.com',
                    icon: 'forum'
                },
                {
                    title: 'Hacker News',
                    description: 'Tech news and discussions',
                    url: 'https://news.ycombinator.com',
                    icon: 'newspaper'
                }
            ]
        },
        {
            title: 'Learning',
            icon: 'school',
            color: '#ffd93d',
            links: [
                {
                    title: 'YouTube',
                    description: 'Video tutorials and content',
                    url: 'https://youtube.com',
                    icon: 'play_circle'
                },
                {
                    title: 'Coursera',
                    description: 'Online courses',
                    url: 'https://coursera.org',
                    icon: 'book'
                },
                {
                    title: 'Udemy',
                    description: 'Self-paced learning',
                    url: 'https://udemy.com',
                    icon: 'school'
                }
            ]
        }
    ], null, 2);
}

const DEFAULT_THEME_MODE = 'auto';
const VALID_THEME_MODES = ['auto', 'dark', 'light'];

function normalizeThemeMode(themeMode) {
    return VALID_THEME_MODES.includes(themeMode) ? themeMode : DEFAULT_THEME_MODE;
}

async function saveThemeMode(themeMode) {
    const normalizedMode = normalizeThemeMode(themeMode);

    try {
        try {
            await browser.storage.sync.set({themeMode: normalizedMode});
        } catch (syncError) {
            console.warn('Sync storage write failed for theme, falling back to local:', syncError);
            await browser.storage.local.set({themeMode: normalizedMode});
        }

        return {valid: true, mode: normalizedMode};
    } catch (error) {
        console.error('Failed to save theme mode:', error);
        return {valid: false, error: error.message};
    }
}

async function getThemeMode() {
    try {
        let result;

        try {
            result = await browser.storage.sync.get('themeMode');
            if (typeof result.themeMode === 'undefined') {
                result = await browser.storage.local.get('themeMode');
            }
        } catch (syncError) {
            console.warn('Sync storage read failed for theme, trying local:', syncError);
            result = await browser.storage.local.get('themeMode');
        }

        return normalizeThemeMode(result.themeMode);
    } catch (error) {
        console.error('Failed to retrieve theme mode:', error);
        return DEFAULT_THEME_MODE;
    }
}

function resolveThemeMode(themeMode) {
    const normalizedMode = normalizeThemeMode(themeMode);
    if (normalizedMode !== 'auto') {
        return normalizedMode;
    }

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'light';
}

function applyTheme(themeMode) {
    const mode = normalizeThemeMode(themeMode);
    const resolvedTheme = resolveThemeMode(mode);

    document.body.setAttribute('data-theme-mode', mode);
    document.body.setAttribute('data-theme', resolvedTheme);

    return {mode, resolvedTheme};
}

function watchSystemThemeChanges(themeMode, onThemeChange) {
    const mode = normalizeThemeMode(themeMode);
    if (mode !== 'auto' || !window.matchMedia) {
        return () => {};
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
        const currentMode = document.body.getAttribute('data-theme-mode');
        if (currentMode !== 'auto') {
            return;
        }

        const state = applyTheme('auto');
        if (typeof onThemeChange === 'function') {
            onThemeChange(state);
        }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }

    // Fallback for older APIs
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
}


/* Render links into a provided container. This mirrors the new tab renderer so
   the settings preview looks identical to the new tab. */
function renderLinksInto(container, categories) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(categories) || categories.length === 0) {
        container.innerHTML = '<p class="empty-state">No links configured yet.</p>';
        return;
    }

    categories.forEach((category) => {
        const section = document.createElement('section');
        section.className = 'category';

        if (category.color) {
            section.style.setProperty('--accent-color', category.color);
        }

        const titleRow = document.createElement('div');
        titleRow.className = 'category-title';

        const categoryIcon = document.createElement('span');
        categoryIcon.className = 'material-symbols-outlined';
        categoryIcon.setAttribute('aria-hidden', 'true');
        categoryIcon.textContent = category.icon || 'folder';
        titleRow.appendChild(categoryIcon);

        const heading = document.createElement('h2');
        heading.textContent = category.title;
        titleRow.appendChild(heading);
        section.appendChild(titleRow);

        const linkList = document.createElement('div');
        linkList.className = 'link-list';

        (category.links || []).forEach((item) => {
            const link = document.createElement('a');
            link.className = 'link-button';
            link.href = item.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';

            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined link-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = item.icon || 'open_in_new';
            link.appendChild(icon);

            const content = document.createElement('span');
            content.className = 'link-content';

            const title = document.createElement('span');
            title.className = 'link-title';
            title.textContent = item.title;
            content.appendChild(title);

            if (item.description) {
                const description = document.createElement('span');
                description.className = 'link-description';
                description.textContent = item.description;
                content.appendChild(description);
            }

            link.appendChild(content);

            linkList.appendChild(link);
        });

        section.appendChild(linkList);
        container.appendChild(section);
    });
}


