/**
 * Guide layer: static onboarding reference for systems, water, nutrients and
 * first-time setup.
 */
(function () {
    'use strict';

    function listPanel(ctx, title, items, withNames) {
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', title));
        const list = UIAPI.el('ul', 'source-list');
        items.forEach((item) => {
            const li = UIAPI.el('li');
            if (withNames) {
                li.appendChild(UIAPI.el('b', null, item.name + '. '));
                li.appendChild(document.createTextNode(item.text));
            } else {
                li.textContent = item;
            }
            list.appendChild(li);
        });
        wrap.appendChild(list);
        return wrap;
    }

    function render(ctx) {
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.guide.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.guide.intro));

        section.appendChild(listPanel(ctx, t.guide.systemsTitle, t.guide.systems, true));
        section.appendChild(listPanel(ctx, t.guide.waterTitle, t.guide.water, false));
        section.appendChild(listPanel(ctx, t.guide.nutrientTitle, t.guide.nutrient, false));
        section.appendChild(listPanel(ctx, t.guide.firstTitle, t.guide.first, false));
        return section;
    }

    const layer = {
        id: 'guide',
        labelKey: 'guide',
        render: render
    };

    Core.registerLayer(layer);
})();