/**
 * Crops layer.
 *
 * Renders the crop database: list with search + category filter, and the
 * per-crop detail pages. Holds its own view state (search, category, open
 * crop) inside the module closure so it survives tab switches.
 */
(function () {
    'use strict';

    const NUTRIENT_LINE_BY_ID = {};
    NUTRIENT_LINES.forEach((line) => {
        NUTRIENT_LINE_BY_ID[line.id] = line;
    });

    const view = {
        search: '',
        category: 'all',
        openCropId: null
    };

    function render(ctx) {
        if (view.openCropId) {
            return renderCropDetail(ctx, view.openCropId);
        }
        return renderList(ctx);
    }

    function renderList(ctx) {
        const section = UIAPI.el('section', 'tab-panel');

        const toolbar = UIAPI.el('div', 'crop-toolbar');
        const search = UIAPI.el('input', 'field');
        search.type = 'search';
        search.placeholder = ctx.T().crops.searchPlaceholder;
        search.value = view.search;
        search.setAttribute('aria-label', ctx.T().crops.searchPlaceholder);
        search.addEventListener('input', (e) => {
            view.search = e.target.value.trim().toLowerCase();
            updateCropGrid(ctx, cropCount, grid);
        });

        const filter = UIAPI.el('select', 'field');
        filter.setAttribute('aria-label', ctx.T().crops.categoryFilter);
        const catLabels = ctx.T().crops.categories;
        Object.keys(catLabels).forEach((key) => {
            const opt = UIAPI.el('option', null, catLabels[key]);
            opt.value = key;
            filter.appendChild(opt);
        });
        filter.value = view.category;
        filter.addEventListener('change', (e) => {
            view.category = e.target.value;
            updateCropGrid(ctx, cropCount, grid);
        });

        toolbar.appendChild(search);
        toolbar.appendChild(filter);

        const cropCount = UIAPI.el('span', 'crop-count', '');
        toolbar.appendChild(cropCount);

        const grid = UIAPI.el('div', 'crop-grid');
        section.appendChild(toolbar);
        section.appendChild(grid);
        updateCropGrid(ctx, cropCount, grid);
        return section;
    }

    function updateCropGrid(ctx, cropCount, grid) {
        const t = ctx.T();
        const filtered = filterCrops();
        cropCount.textContent = filtered.length === 1 ?
            '1 ' + t.crops.countSingular : filtered.length + ' ' + t.crops.countPlural;
        grid.replaceChildren();
        if (filtered.length === 0) {
            grid.appendChild(UIAPI.el('p', 'empty-message', t.crops.noResults));
            return;
        }
        filtered.forEach((crop) => {
            grid.appendChild(renderCropCard(ctx, crop));
        });
    }

    function filterCrops() {
        return CROP_DATA.filter((crop) => {
            const inCategory = view.category === 'all' || crop.category === view.category;
            const needle = view.search;
            if (!needle) {
                return inCategory;
            }
            const text = (crop.names.en + ' ' + crop.names.nl).toLowerCase();
            return inCategory && text.includes(needle);
        });
    }

    function renderCropCard(ctx, crop) {
        const t = ctx.T();
        const card = UIAPI.el('button', 'crop-card');
        card.addEventListener('click', () => {
            view.openCropId = crop.id;
            ctx.nav.render();
        });

        const lastStage = crop.stages[crop.stages.length - 1];
        const harvest = crop.growth.daysToHarvest;

        const head = UIAPI.el('div', 'crop-card-head');
        head.appendChild(UIAPI.el('span', 'crop-emoji', crop.emoji));
        const nameWrap = UIAPI.el('div', 'crop-card-name');
        nameWrap.appendChild(UIAPI.el('h3', null, ctx.services.cropName(crop, ctx.lang)));
        nameWrap.appendChild(UIAPI.el('span', 'crop-card-latin', crop.names.en));
        head.appendChild(nameWrap);

        const meta = UIAPI.el('div', 'crop-card-meta');
        meta.appendChild(UIAPI.el('span', 'badge', t.crops.categories[crop.category]));
        meta.appendChild(UIAPI.el(
            'span', 'crop-card-stat',
            t.crop.ec + ' ' + UIAPI.formatRange(lastStage.ec, ctx.lang, 1)
        ));
        meta.appendChild(UIAPI.el(
            'span', 'crop-card-stat',
            t.crop.daysToHarvest + ' ' + UIAPI.formatRange(harvest, ctx.lang, 0) + ' d'
        ));

        card.appendChild(head);
        card.appendChild(meta);
        return card;
    }

    function renderCropDetail(ctx, cropId) {
        const crop = CROP_DATA.find((c) => c.id === cropId);
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');

        const back = UIAPI.el('button', 'btn ghost', t.crop.backToList);
        back.addEventListener('click', () => {
            view.openCropId = null;
            ctx.nav.render();
        });
        section.appendChild(back);

        const header = UIAPI.el('div', 'crop-detail-header');
        header.appendChild(UIAPI.el('span', 'crop-emoji large', crop.emoji));
        const hw = UIAPI.el('div');
        const hTitle = UIAPI.el('h2', null, ctx.services.cropName(crop, ctx.lang));
        hw.appendChild(hTitle);
        hw.appendChild(UIAPI.el('span', 'crop-card-latin', crop.names.en + ' \u00b7 ' + t.crops.categories[crop.category]));
        header.appendChild(hw);
        section.appendChild(header);

        section.appendChild(stageTable(ctx, crop));
        section.appendChild(climateTable(ctx, crop));
        section.appendChild(growthBlock(ctx, crop));
        section.appendChild(rowsBlock(ctx, [
            [t.crop.spacing, UIAPI.formatRange(crop.spacing, ctx.lang, 0) + ' ' + t.crop.units.cm],
            [t.crop.systemsTitle, crop.systems.map((s) => t.crop.systems[s]).join(', ')]
        ]));
        section.appendChild(feedBlock(ctx, crop));
        section.appendChild(recipeBlock(ctx, crop));
        if (crop.troubleshooting && crop.troubleshooting.length) {
            section.appendChild(troubleshootingBlock(ctx, crop));
        }
        section.appendChild(notesBlock(ctx, crop));
        section.appendChild(sourcesBlock(ctx, crop));
        return section;
    }

    function stageTable(ctx, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.stageLabel));

        const table = UIAPI.el('table', 'data-table');
        const thead = UIAPI.el('thead');
        const headRow = UIAPI.el('tr');
        [t.crop.stageLabel, t.crop.ec, t.crop.ph, t.crop.ppm500, t.crop.ppm700]
            .forEach((h) => headRow.appendChild(UIAPI.el('th', null, h)));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = UIAPI.el('tbody');
        crop.stages.forEach((stage) => {
            const tr = UIAPI.el('tr');
            tr.appendChild(UIAPI.el('td', null, t.crop.stages[stage.key] || stage.key));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ec, ctx.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ph, ctx.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ec.map((v) => Calc.ecToPpm(v, 500)), ctx.lang, 0)));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ec.map((v) => Calc.ecToPpm(v, 700)), ctx.lang, 0)));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function climateTable(ctx, crop) {
        const t = ctx.T();
        const c = crop.climate;
        const rows = [
            [t.crop.airTemp, UIAPI.formatRange(c.airTemp, ctx.lang, 0) + ' ' + t.crop.units.celsius],
            [t.crop.waterTemp, UIAPI.formatRange(c.waterTemp, ctx.lang, 0) + ' ' + t.crop.units.celsius],
            [t.crop.humidity, UIAPI.formatRange(c.humidity, ctx.lang, 0) + ' ' + t.crop.units.humidity],
            [t.crop.dli, UIAPI.formatRange(c.dli, ctx.lang, 1) + ' ' + t.crop.units.dli],
            [t.crop.photoperiod, UIAPI.formatRange(c.photoperiod, ctx.lang, 0) + ' ' + t.crop.units.hours]
        ];
        return rowsBlock(ctx, rows, t.crop.climate);
    }

    function growthBlock(ctx, crop) {
        const t = ctx.T();
        const g = crop.growth;
        const rows = [
            [t.crop.germination, UIAPI.formatRange(g.germination, ctx.lang, 0) + ' d'],
            [t.crop.daysToHarvest, UIAPI.formatRange(g.daysToHarvest, ctx.lang, 0) + ' d']
        ];
        const wrap = rowsBlock(ctx, rows, t.crop.growth);
        wrap.appendChild(UIAPI.el('p', 'note-text', g.note[ctx.lang]));
        return wrap;
    }

    function rowsBlock(ctx, rows, title) {
        const wrap = UIAPI.el('div', 'panel');
        if (title) {
            wrap.appendChild(UIAPI.el('h3', 'panel-title', title));
        }
        const table = UIAPI.el('table', 'data-table kv');
        const tbody = UIAPI.el('tbody');
        rows.forEach(([k, v]) => {
            const tr = UIAPI.el('tr');
            tr.appendChild(UIAPI.el('th', null, k));
            tr.appendChild(UIAPI.el('td', null, v));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function feedBlock(ctx, crop) {
        const t = ctx.T();
        const feed = crop.feed;
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.feedTitle));
        const ratio = feed.ratio;
        const ratioEl = UIAPI.el('p', 'npk-ratio');
        ratioEl.appendChild(UIAPI.el('b', null, t.crop.npkRatio + ': '));
        ratioEl.appendChild(document.createTextNode(
            ratio.n + ' : ' + ratio.p + ' : ' + ratio.k
        ));
        wrap.appendChild(ratioEl);
        wrap.appendChild(UIAPI.el('p', 'note-text', feed.note[ctx.lang]));
        return wrap;
    }

    function recipeBlock(ctx, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.recipesTitle));
        crop.recipes.forEach((recipeId) => {
            const line = NUTRIENT_LINE_BY_ID[recipeId];
            if (!line) {
                return;
            }
            const lineTitle = UIAPI.el('p', 'recipe-line');
            lineTitle.appendChild(UIAPI.el('b', null, line.name));
            wrap.appendChild(lineTitle);
            const partsEl = UIAPI.el('ul', 'recipe-parts');
            line.parts.forEach((part) => {
                partsEl.appendChild(UIAPI.el(
                    'li', null,
                    part.product + ' \u2014 ' + UIAPI.formatNumber(part.amount, ctx.lang, 2) + ' ' + part.unit + '/L'
                ));
            });
            wrap.appendChild(partsEl);
        });
        return wrap;
    }

    function troubleshootingBlock(ctx, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.troubleshooting));

        crop.troubleshooting.forEach((issue) => {
            const card = UIAPI.el('div', 'issue-card');
            card.appendChild(UIAPI.el('h4', 'issue-title', issue.symptom[ctx.lang]));
            const causeRow = UIAPI.el('p', 'issue-row');
            causeRow.appendChild(UIAPI.el('b', null, t.crop.troubleCause + ': '));
            causeRow.appendChild(document.createTextNode(issue.cause[ctx.lang]));
            card.appendChild(causeRow);
            const fixRow = UIAPI.el('p', 'issue-row');
            fixRow.appendChild(UIAPI.el('b', null, t.crop.troubleFix + ': '));
            fixRow.appendChild(document.createTextNode(issue.fix[ctx.lang]));
            card.appendChild(fixRow);
            wrap.appendChild(card);
        });
        return wrap;
    }

    function notesBlock(ctx, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.notesTitle));
        wrap.appendChild(UIAPI.el('p', 'note-text', crop.notes[ctx.lang]));
        return wrap;
    }

    function sourcesBlock(ctx, crop) {
        const t = ctx.T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.sourcesTitle));
        const list = UIAPI.el('ul', 'source-list');
        crop.sources.forEach((refId) => {
            const ref = REFERENCES.find((r) => r.id === refId);
            if (!ref) {
                return;
            }
            const li = UIAPI.el('li');
            if (ref.url) {
                const a = UIAPI.el('a', null, ref.title);
                a.href = ref.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                li.appendChild(a);
                li.appendChild(UIAPI.el('span', 'source-meta', ' \u2014 ' + ref.publisher));
            } else {
                li.textContent = ref.title + ' \u2014 ' + ref.publisher;
            }
            list.appendChild(li);
        });
        wrap.appendChild(list);
        return wrap;
    }

    const layer = {
        id: 'crops',
        labelKey: 'crops',
        render: render
    };

    Core.registerLayer(layer);
})();