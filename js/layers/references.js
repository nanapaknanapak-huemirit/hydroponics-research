/**
 * References layer: table of cited sources behind every number in the app.
 */
(function () {
    'use strict';

    function render(ctx) {
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.references.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.references.intro));

        const table = UIAPI.el('table', 'data-table');
        const thead = UIAPI.el('thead');
        const headRow = UIAPI.el('tr');
        Object.keys(t.references.tableHeaders)
            .forEach((key) => headRow.appendChild(UIAPI.el('th', null, t.references.tableHeaders[key])));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = UIAPI.el('tbody');
        REFERENCES.forEach((ref) => {
            const tr = UIAPI.el('tr');
            tr.appendChild(UIAPI.el('td', null, ref.publisher));
            const titleCell = UIAPI.el('td');
            if (ref.url) {
                const a = UIAPI.el('a', null, ref.title);
                a.href = ref.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                titleCell.appendChild(a);
            } else {
                titleCell.textContent = ref.title;
            }
            tr.appendChild(titleCell);
            tr.appendChild(UIAPI.el('td', null, String(ref.year || '\u2014')));
            tr.appendChild(UIAPI.el('td', null, t.references.types[ref.type] || ref.type));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        section.appendChild(table);

        const disclaimer = UIAPI.el('p', 'note-text', t.references.disclaimer);
        section.appendChild(disclaimer);
        return section;
    }

    const layer = {
        id: 'references',
        labelKey: 'references',
        render: render
    };

    Core.registerLayer(layer);
})();