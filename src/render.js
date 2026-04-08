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

export { renderLinksInto };

