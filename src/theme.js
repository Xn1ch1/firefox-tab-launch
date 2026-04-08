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

export { DEFAULT_THEME_MODE, VALID_THEME_MODES, normalizeThemeMode, saveThemeMode, getThemeMode, resolveThemeMode, applyTheme, watchSystemThemeChanges };

