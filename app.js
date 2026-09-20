/**
 * App state, rendering and event wiring for all four tabs.
 *
 * Data/model modules come first (data/*, js/i18n.js, js/calc.js, js/ui.js).
 * Global scope mirrors the family of apps; event listeners are attached in
 * init(), never inline.
 */
(function () {
    'use strict';

    const state = {
        lang: 'en',
        tab: 'crops',
        cropSearch: '',
        cropCategory: 'all',
        openCropId: null,
        calc: {
            ecInput: '1.4',
            doseCrop: 'lettuce',
            doseStage: 'seedling',
            doseLine: 'masterblend',
            doseVolume: '20',
            doseSourceEc: '0.2',
            doseTargetEc: '1.4',
            dliCrop: 'lettuce',
            dliPpfd: '400',
            dliHours: '16',
            planCrop: 'lettuce',
            planStart: '',
            planPerWeek: '2',
            planWeeks: '4'
        },
        journal: { grows: [] },
        journalSelectedId: null,
        journalCreateOpen: false
    };

    const T = () => UI_STRINGS[state.lang];
    const cropName = (crop) => crop.names[state.lang];
    const JOURNAL_STORAGE_KEY = 'hydroponics.journal.v1';
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const NUTRIENT_LINE_BY_ID = {};
    NUTRIENT_LINES.forEach((line) => {
        NUTRIENT_LINE_BY_ID[line.id] = line;
    });

    /* ------------------------------------------------------------------ */
    /* Navigation                                                          */
    /* ------------------------------------------------------------------ */

    function switchTab(tab) {
        state.tab = tab;
        document.querySelectorAll('.nav-tab').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        render();
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            window.scrollTo(0, 0);
        }
    }

    function switchLanguage(lang) {
        state.lang = lang;
        document.documentElement.lang = lang;
        document.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        updateHeader();
        render();
    }

    /* ------------------------------------------------------------------ */
    /* Root render                                                         */
    /* ------------------------------------------------------------------ */

    function render() {
        const app = document.getElementById('app');
        app.replaceChildren();
        app.appendChild(renderTab());
        refreshCalcResults();
    }

    /**
     * Calculator result panels are filled after the tab is attached to the
     * DOM, so getElementById() inside each updater always finds its node.
     */
    function refreshCalcResults() {
        if (state.tab !== 'calculators') {
            return;
        }
        updateEcResults();
        updateDoseResults();
        updateDliResults();
        updatePlanResults();
    }

    function renderTab() {
        switch (state.tab) {
            case 'crops':
                return renderCrops();
            case 'journal':
                return renderJournal();
            case 'calculators':
                return renderCalculators();
            case 'guide':
                return renderGuide();
            case 'references':
                return renderReferences();
            default:
                return UIAPI.el('p', 'error-message', T().appTitle);
        }
    }

    function updateHeader() {
        const t = T();
        document.getElementById('app-title').textContent = t.appTitle;
        document.getElementById('app-subtitle').textContent = t.appSubtitle;
        const langLabel = document.getElementById('lang-label');
        if (langLabel) {
            langLabel.textContent = t.lang.label;
        }
        const disclaimer = document.getElementById('footer-disclaimer');
        if (disclaimer) {
            disclaimer.textContent = t.disclaimer;
        }
        document.querySelectorAll('[data-nav-label]').forEach((btn) => {
            const label = t.tabs[btn.dataset.navLabel];
            if (label) {
                btn.textContent = label;
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /* Crops tab                                                           */
    /* ------------------------------------------------------------------ */

    function renderCrops() {
        const section = UIAPI.el('section', 'tab-panel');

        if (state.openCropId) {
            section.appendChild(renderCropDetail(state.openCropId));
            return section;
        }

        const toolbar = UIAPI.el('div', 'crop-toolbar');
        const search = UIAPI.el('input', 'field');
        search.type = 'search';
        search.placeholder = T().crops.searchPlaceholder;
        search.value = state.cropSearch;
        search.setAttribute('aria-label', T().crops.searchPlaceholder);
        search.addEventListener('input', (e) => {
            state.cropSearch = e.target.value.trim().toLowerCase();
            updateCropGrid(cropCount, grid);
        });

        const filter = UIAPI.el('select', 'field');
        filter.setAttribute('aria-label', T().crops.categoryFilter);
        const catLabels = T().crops.categories;
        Object.keys(catLabels).forEach((key) => {
            const opt = UIAPI.el('option', null, catLabels[key]);
            opt.value = key;
            filter.appendChild(opt);
        });
        filter.value = state.cropCategory;
        filter.addEventListener('change', (e) => {
            state.cropCategory = e.target.value;
            updateCropGrid(cropCount, grid);
        });

        toolbar.appendChild(search);
        toolbar.appendChild(filter);

        const cropCount = UIAPI.el('span', 'crop-count', '');
        toolbar.appendChild(cropCount);

        const grid = UIAPI.el('div', 'crop-grid');
        section.appendChild(toolbar);
        section.appendChild(grid);
        updateCropGrid(cropCount, grid);
        return section;
    }

    function updateCropGrid(cropCount, grid) {
        const t = T();
        const filtered = filterCrops();
        cropCount.textContent = filtered.length === 1 ?
            '1 ' + t.crops.countSingular : filtered.length + ' ' + t.crops.countPlural;
        grid.replaceChildren();
        if (filtered.length === 0) {
            grid.appendChild(UIAPI.el('p', 'empty-message', t.crops.noResults));
            return;
        }
        filtered.forEach((crop) => {
            grid.appendChild(renderCropCard(crop));
        });
    }

    function filterCrops() {
        const t = T();
        return CROP_DATA.filter((crop) => {
            const inCategory = state.cropCategory === 'all' || crop.category === state.cropCategory;
            const needle = state.cropSearch;
            if (!needle) {
                return inCategory;
            }
            const text = (crop.names.en + ' ' + crop.names.nl).toLowerCase();
            return inCategory && text.includes(needle);
        });
    }

    function renderCropCard(crop) {
        const t = T();
        const card = UIAPI.el('button', 'crop-card');
        card.addEventListener('click', () => {
            state.openCropId = crop.id;
            render();
        });

        const lastStage = crop.stages[crop.stages.length - 1];
        const harvest = crop.growth.daysToHarvest;

        const head = UIAPI.el('div', 'crop-card-head');
        head.appendChild(UIAPI.el('span', 'crop-emoji', crop.emoji));
        const nameWrap = UIAPI.el('div', 'crop-card-name');
        nameWrap.appendChild(UIAPI.el('h3', null, cropName(crop)));
        nameWrap.appendChild(UIAPI.el('span', 'crop-card-latin', crop.names.en));
        head.appendChild(nameWrap);

        const meta = UIAPI.el('div', 'crop-card-meta');
        meta.appendChild(UIAPI.el('span', 'badge', t.crops.categories[crop.category]));
        meta.appendChild(UIAPI.el(
            'span', 'crop-card-stat',
            t.crop.ec + ' ' + UIAPI.formatRange(lastStage.ec, state.lang, 1)
        ));
        meta.appendChild(UIAPI.el(
            'span', 'crop-card-stat',
            t.crop.daysToHarvest + ' ' + UIAPI.formatRange(harvest, state.lang, 0) + ' d'
        ));

        card.appendChild(head);
        card.appendChild(meta);
        return card;
    }

    function renderCropDetail(cropId) {
        const crop = CROP_DATA.find((c) => c.id === cropId);
        const t = T();
        const section = UIAPI.el('section', 'tab-panel');

        const back = UIAPI.el('button', 'btn ghost', t.crop.backToList);
        back.addEventListener('click', () => {
            state.openCropId = null;
            render();
        });
        section.appendChild(back);

        const header = UIAPI.el('div', 'crop-detail-header');
        header.appendChild(UIAPI.el('span', 'crop-emoji large', crop.emoji));
        const hw = UIAPI.el('div');
        const hTitle = UIAPI.el('h2', null, cropName(crop));
        hw.appendChild(hTitle);
        hw.appendChild(UIAPI.el('span', 'crop-card-latin', crop.names.en + ' \u00b7 ' + t.crops.categories[crop.category]));
        header.appendChild(hw);
        section.appendChild(header);

        section.appendChild(stageTable(crop));
        section.appendChild(climateTable(crop));
        section.appendChild(growthBlock(crop));
        section.appendChild(rowsBlock([
            [t.crop.spacing, UIAPI.formatRange(crop.spacing, state.lang, 0) + ' ' + t.crop.units.cm],
            [t.crop.systemsTitle, crop.systems.map((s) => t.crop.systems[s]).join(', ')]
        ]));
        section.appendChild(feedBlock(crop));
        section.appendChild(recipeBlock(crop));
        if (crop.troubleshooting && crop.troubleshooting.length) {
            section.appendChild(troubleshootingBlock(crop));
        }
        section.appendChild(notesBlock(crop));
        section.appendChild(sourcesBlock(crop));
        return section;
    }

    function stageTable(crop) {
        const t = T();
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
            tr.appendChild(UIAPI.el('td', null, T().crop.stages[stage.key] || stage.key));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ec, state.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ph, state.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ec.map((v) => Calc.ecToPpm(v, 500)), state.lang, 0)));
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatRange(stage.ec.map((v) => Calc.ecToPpm(v, 700)), state.lang, 0)));
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    function climateTable(crop) {
        const t = T();
        const c = crop.climate;
        const rows = [
            [t.crop.airTemp, UIAPI.formatRange(c.airTemp, state.lang, 0) + ' ' + t.crop.units.celsius],
            [t.crop.waterTemp, UIAPI.formatRange(c.waterTemp, state.lang, 0) + ' ' + t.crop.units.celsius],
            [t.crop.humidity, UIAPI.formatRange(c.humidity, state.lang, 0) + ' ' + t.crop.units.humidity],
            [t.crop.dli, UIAPI.formatRange(c.dli, state.lang, 1) + ' ' + t.crop.units.dli],
            [t.crop.photoperiod, UIAPI.formatRange(c.photoperiod, state.lang, 0) + ' ' + t.crop.units.hours]
        ];
        return rowsBlock(rows, t.crop.climate);
    }

    function growthBlock(crop) {
        const t = T();
        const g = crop.growth;
        const rows = [
            [t.crop.germination, UIAPI.formatRange(g.germination, state.lang, 0) + ' d'],
            [t.crop.daysToHarvest, UIAPI.formatRange(g.daysToHarvest, state.lang, 0) + ' d']
        ];
        const wrap = rowsBlock(rows, t.crop.growth);
        wrap.appendChild(UIAPI.el('p', 'note-text', g.note[state.lang]));
        return wrap;
    }

    function rowsBlock(rows, title) {
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

    function feedBlock(crop) {
        const t = T();
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
        wrap.appendChild(UIAPI.el('p', 'note-text', feed.note[state.lang]));
        return wrap;
    }

    function recipeBlock(crop) {
        const t = T();
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
                    part.product + ' \u2014 ' + UIAPI.formatNumber(part.amount, state.lang, 2) + ' ' + part.unit + '/L'
                ));
            });
            wrap.appendChild(partsEl);
        });
        return wrap;
    }

    function troubleshootingBlock(crop) {
        const t = T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.troubleshooting));

        crop.troubleshooting.forEach((issue) => {
            const card = UIAPI.el('div', 'issue-card');
            card.appendChild(UIAPI.el('h4', 'issue-title', issue.symptom[state.lang]));
            const causeRow = UIAPI.el('p', 'issue-row');
            causeRow.appendChild(UIAPI.el('b', null, t.crop.troubleCause + ': '));
            causeRow.appendChild(document.createTextNode(issue.cause[state.lang]));
            card.appendChild(causeRow);
            const fixRow = UIAPI.el('p', 'issue-row');
            fixRow.appendChild(UIAPI.el('b', null, t.crop.troubleFix + ': '));
            fixRow.appendChild(document.createTextNode(issue.fix[state.lang]));
            card.appendChild(fixRow);
            wrap.appendChild(card);
        });
        return wrap;
    }

    function notesBlock(crop) {
        const t = T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.crop.notesTitle));
        wrap.appendChild(UIAPI.el('p', 'note-text', crop.notes[state.lang]));
        return wrap;
    }

    function sourcesBlock(crop) {
        const t = T();
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

    /* ------------------------------------------------------------------ */
    /* Calculators tab                                                     */
    /* ------------------------------------------------------------------ */

    function renderCalculators() {
        const t = T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.calculators.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.calculators.subtitle));
        section.appendChild(renderEcConverter());
        section.appendChild(renderDoseCalc());
        section.appendChild(renderDliCalc());
        section.appendChild(renderPlanner());
        return section;
    }

    function panel(titleEl, extra) {
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(titleEl);
        if (extra) {
            wrap.appendChild(extra);
        }
        return wrap;
    }

    function renderEcConverter() {
        const t = T();
        const wrap = panel(UIAPI.el('h3', 'panel-title', t.calculators.ecTitle));
        wrap.appendChild(UIAPI.el('p', 'subtitle', t.calculators.ecDesc));

        const ecInput = UIAPI.el('input', 'field');
        ecInput.type = 'number';
        ecInput.min = '0';
        ecInput.step = '0.1';
        ecInput.value = state.calc.ecInput;
        ecInput.setAttribute('aria-label', t.calculators.ecInput);
        ecInput.addEventListener('input', (e) => {
            state.calc.ecInput = e.target.value;
            updateEcResults();
        });

        const form = UIAPI.el('label', 'field-row');
        form.appendChild(UIAPI.el('span', 'field-label', t.calculators.ecInput));
        form.appendChild(ecInput);
        wrap.appendChild(form);

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'ec-results';
        wrap.appendChild(results);

        const note = UIAPI.el('p', 'note-text', t.calculators.ecNote);
        wrap.appendChild(note);
        return wrap;
    }

    function updateEcResults() {
        const t = T();
        const ec = parseNumber(state.calc.ecInput);
        const container = document.getElementById('ec-results');
        if (container === null || Number.isNaN(ec)) {
            return;
        }
        container.replaceChildren();
        [500, 640, 700].forEach((scale) => {
            const label = scale === 500 ? t.calculators.ppm500 :
                scale === 640 ? t.calculators.ppm640 : t.calculators.ppm700;
            const row = UIAPI.el('div', 'result-row');
            const value = UIAPI.formatNumber(Calc.ecToPpm(ec, scale), state.lang, 0);
            row.appendChild(UIAPI.el('span', null, label));
            row.appendChild(UIAPI.el('b', null, value));
            container.appendChild(row);
        });
    }

    function cropOptions() {
        return CROP_DATA.map((crop) => {
            const opt = UIAPI.el('option', null, cropName(crop));
            opt.value = crop.id;
            return opt;
        });
    }

    function stageOptions(crop) {
        return crop.stages.map((stage) => {
            const opt = UIAPI.el('option', null, T().crop.stages[stage.key] || stage.key);
            opt.value = stage.key;
            return opt;
        });
    }

    function renderDoseCalc() {
        const t = T();
        const wrap = panel(
            UIAPI.el('h3', 'panel-title', t.calculators.doseTitle),
            UIAPI.el('p', 'subtitle', t.calculators.doseDesc)
        );

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.calculators.doseCrop);
        cropSelect.appendChild(UIAPI.el('option', null, ''));
        cropOptions().forEach((opt) => cropSelect.appendChild(opt));
        cropSelect.value = state.calc.doseCrop;
        cropSelect.addEventListener('change', (e) => {
            state.calc.doseCrop = e.target.value;
            const crop = CROP_DATA.find((c) => c.id === e.target.value);
            state.calc.doseStage = crop ? crop.stages[0].key : '';
            rerenderDoseStageSelect(stageSelect, crop);
            syncDoseTarget();
        });

        const stageSelect = UIAPI.el('select', 'field');
        stageSelect.setAttribute('aria-label', t.calculators.doseStage);
        stageSelect.addEventListener('change', (e) => {
            state.calc.doseStage = e.target.value;
            syncDoseTarget();
        });

        const lineSelect = UIAPI.el('select', 'field');
        lineSelect.setAttribute('aria-label', t.calculators.doseLine);
        NUTRIENT_LINES.forEach((line) => {
            const opt = UIAPI.el('option', null, line.name);
            opt.value = line.id;
            lineSelect.appendChild(opt);
        });
        lineSelect.value = state.calc.doseLine;
        lineSelect.addEventListener('change', (e) => {
            state.calc.doseLine = e.target.value;
            updateDoseResults();
        });

        const volume = numberField(t.calculators.doseVolume, (v) => { state.calc.doseVolume = v; });
        volume.querySelector('input').value = state.calc.doseVolume;
        const sourceEc = numberField(t.calculators.doseSourceEc, (v) => { state.calc.doseSourceEc = v; });
        sourceEc.querySelector('input').value = state.calc.doseSourceEc;
        const targetField = numberField('', (v) => { state.calc.doseTargetEc = v; });
        const targetInput = targetField.querySelector('input');
        targetInput.id = 'dose-target';
        targetInput.value = state.calc.doseTargetEc;
        const targetLabel = targetField.querySelector('.field-label');
        targetLabel.textContent = t.calculators.doseTargetEc;

        const btn = UIAPI.el('button', 'btn primary', t.calculators.doseBtn);
        btn.type = 'button';
        btn.addEventListener('click', updateDoseResults);

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'dose-results';
        const sourceNote = UIAPI.el('p', 'note-text', t.calculators.doseSource);

        wrap.appendChild(fieldRow(t.calculators.doseCrop, cropSelect));
        wrap.appendChild(fieldRow(t.calculators.doseStage, stageSelect));
        wrap.appendChild(fieldRow(t.calculators.doseLine, lineSelect));
        wrap.appendChild(volume);
        wrap.appendChild(sourceEc);
        wrap.appendChild(targetField);
        wrap.appendChild(btn);
        wrap.appendChild(results);
        wrap.appendChild(sourceNote);

        rerenderDoseStageSelect(stageSelect, CROP_DATA.find((c) => c.id === state.calc.doseCrop));
        syncDoseTarget();
        return wrap;
    }

    function rerenderDoseStageSelect(stageSelect, crop) {
        const stageSelectEl = stageSelect;
        stageSelectEl.replaceChildren();
        if (!crop) {
            return;
        }
        stageOptions(crop).forEach((opt) => stageSelectEl.appendChild(opt));
        stageSelectEl.value = state.calc.doseStage;
    }

    /**
     * Prefill the target-EC input with the middle of the selected crop stage's
     * EC range (still fully editable), then refresh the result list.
     */
    function syncDoseTarget() {
        const crop = CROP_DATA.find((c) => c.id === state.calc.doseCrop);
        const stage = crop ? crop.stages.find((s) => s.key === state.calc.doseStage) : null;
        if (stage) {
            state.calc.doseTargetEc = String((stage.ec[0] + stage.ec[1]) / 2);
            const targetInput = document.getElementById('dose-target');
            if (targetInput) {
                targetInput.value = state.calc.doseTargetEc;
            }
        }
        updateDoseResults();
    }

    function updateDoseResults() {
        const t = T();
        const container = document.getElementById('dose-results');
        if (container === null) {
            return;
        }
        const line = NUTRIENT_LINE_BY_ID[state.calc.doseLine];
        const volumeL = parseNumber(state.calc.doseVolume);
        const sourceEc = parseNumber(state.calc.doseSourceEc);
        const targetEc = parseNumber(state.calc.doseTargetEc);
        if (!line || [volumeL, sourceEc, targetEc].some((n) => Number.isNaN(n))) {
            container.replaceChildren(UIAPI.el('p', 'note-text', '\u2014'));
            return;
        }

        const dose = Calc.scaleLineAmounts(line, targetEc, sourceEc, volumeL);
        container.replaceChildren();

        const title = UIAPI.el('h4', 'calc-result-title',
            t.calculators.doseResultTitle.replace('{volume}', UIAPI.formatNumber(volumeL, state.lang, 0)));
        container.appendChild(title);

        container.appendChild(UIAPI.el(
            'p', 'note-text',
            t.calculators.doseAddToReach.replace('{ec}', UIAPI.formatNumber(dose.needEc, state.lang, 2))
        ));

        const list = UIAPI.el('ul', 'recipe-parts');
        dose.parts.forEach((part) => {
            list.appendChild(UIAPI.el(
                'li', null,
                part.product + ' \u2014 ' + UIAPI.formatNumber(part.amount, state.lang, 1) + ' ' + part.unit
            ));
        });
        container.appendChild(list);
        container.appendChild(UIAPI.el('p', 'note-text', t.calculators.dosepH));
    }

    function renderDliCalc() {
        const t = T();
        const wrap = panel(
            UIAPI.el('h3', 'panel-title', t.calculators.dliTitle),
            UIAPI.el('p', 'subtitle', t.calculators.dliDesc)
        );

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.calculators.dliCrop);
        cropOptions().forEach((opt) => cropSelect.appendChild(opt));
        cropSelect.value = state.calc.dliCrop;
        cropSelect.addEventListener('change', (e) => {
            state.calc.dliCrop = e.target.value;
            updateDliResults();
        });

        const ppfd = numberField(t.calculators.dliPpfd, (v) => { state.calc.dliPpfd = v; });
        ppfd.querySelector('input').value = state.calc.dliPpfd;
        const hours = numberField(t.calculators.dliHours, (v) => { state.calc.dliHours = v; });
        hours.querySelector('input').value = state.calc.dliHours;

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'dli-results';

        wrap.appendChild(fieldRow(t.calculators.dliCrop, cropSelect));
        wrap.appendChild(ppfd);
        wrap.appendChild(hours);
        wrap.appendChild(results);
        return wrap;
    }

    function updateDliResults() {
        const t = T();
        const container = document.getElementById('dli-results');
        if (container === null) {
            return;
        }
        const crop = CROP_DATA.find((c) => c.id === state.calc.dliCrop);
        const ppfd = parseNumber(state.calc.dliPpfd);
        const hours = parseNumber(state.calc.dliHours);
        if (!crop || Number.isNaN(ppfd) || Number.isNaN(hours)) {
            container.replaceChildren(UIAPI.el('p', 'note-text', '\u2014'));
            return;
        }

        const dli = Calc.dliFromPpfd(ppfd, hours);
        container.replaceChildren();

        const row = UIAPI.el('div', 'result-row');
        row.appendChild(UIAPI.el('span', null, t.calculators.dliResult));
        row.appendChild(UIAPI.el('b', null, UIAPI.formatNumber(dli, state.lang, 1) + ' mol/m\u00b2/day'));
        container.appendChild(row);

        const target = crop.climate.dli;
        container.appendChild(UIAPI.el(
            'p', 'note-text',
            t.calculators.dliTargetHint
                .replace('{range}', UIAPI.formatRange(target, state.lang, 1))
                .replace('{name}', cropName(crop))
        ));

        const status = dli < target[0] ? t.calculators.dliBelow :
            dli > target[1] ? t.calculators.dliAbove : t.calculators.dliWithin;
        container.appendChild(UIAPI.el('span', 'status-pill', status));
    }

    function renderPlanner() {
        const t = T();
        const wrap = panel(
            UIAPI.el('h3', 'panel-title', t.calculators.planTitle),
            UIAPI.el('p', 'subtitle', t.calculators.planDesc)
        );

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.calculators.planCrop);
        cropOptions().forEach((opt) => cropSelect.appendChild(opt));
        cropSelect.value = state.calc.planCrop;
        cropSelect.addEventListener('change', (e) => {
            state.calc.planCrop = e.target.value;
            updatePlanResults();
        });

        const start = UIAPI.el('input', 'field');
        start.type = 'date';
        start.value = state.calc.planStart || todayIso();
        start.setAttribute('aria-label', t.calculators.planStart);
        start.addEventListener('change', (e) => {
            state.calc.planStart = e.target.value;
            updatePlanResults();
        });

        const perWeek = numberField(t.calculators.planPerWeek, (v) => { state.calc.planPerWeek = v; });
        perWeek.querySelector('input').value = state.calc.planPerWeek;
        const weeks = numberField(t.calculators.planWeeks, (v) => { state.calc.planWeeks = v; });
        weeks.querySelector('input').value = state.calc.planWeeks;

        const results = UIAPI.el('div', 'calc-results');
        results.id = 'plan-results';

        wrap.appendChild(fieldRow(t.calculators.planCrop, cropSelect));
        wrap.appendChild(fieldRow(t.calculators.planStart, start));
        wrap.appendChild(perWeek);
        wrap.appendChild(weeks);
        wrap.appendChild(results);
        return wrap;
    }

    function updatePlanResults() {
        const t = T();
        const container = document.getElementById('plan-results');
        if (container === null) {
            return;
        }
        const crop = CROP_DATA.find((c) => c.id === state.calc.planCrop);
        const startIso = state.calc.planStart || todayIso();
        if (!crop) {
            container.replaceChildren();
            return;
        }

        container.replaceChildren();

        const offsets = Calc.timelineOffsets(crop);
        const list = UIAPI.el('ul', 'source-list');
        offsets.forEach((step) => {
            const label = step.key === 'germination' ? t.calculators.planGermination : t.calculators.planHarvest;
            const fromIso = Calc.addDays(startIso, step.daysMin);
            const toIso = Calc.addDays(startIso, step.daysMax);
            const li = UIAPI.el('li');
            li.appendChild(UIAPI.el('b', null, label + ': '));
            li.appendChild(document.createTextNode(
                UIAPI.formatDate(fromIso, state.lang) + ' \u2013 ' + UIAPI.formatDate(toIso, state.lang)
            ));
            list.appendChild(li);
        });
        container.appendChild(list);

        try {
            const perWeek = parseNumber(state.calc.planPerWeek);
            const weeks = parseNumber(state.calc.planWeeks);
            if (!Number.isNaN(perWeek) && !Number.isNaN(weeks) && perWeek >= 1 && weeks >= 1) {
                const stagger = Calc.staggerPlantings(crop, startIso, perWeek, weeks);
                const subtitle = UIAPI.el('p', 'note-text',
                    perWeek + ' ' + (perWeek === 1 ? t.crops.countSingular : t.crops.countPlural) +
                    '/week \u00d7 ' + weeks + ' wk');
                container.appendChild(subtitle);
                const staggerList = UIAPI.el('ul', 'source-list');
                stagger.forEach((entry) => {
                    staggerList.appendChild(UIAPI.el('li', null, UIAPI.formatDate(entry.iso, state.lang)));
                });
                container.appendChild(staggerList);
            }
        } catch (err) {
            container.appendChild(UIAPI.el('p', 'note-text', err.message));
        }

        container.appendChild(UIAPI.el('p', 'note-text', t.calculators.planInfo));
    }

    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    /* ------------------------------------------------------------------ */
    /* Guide and references tabs                                           */
    /* ------------------------------------------------------------------ */

    function renderGuide() {
        const t = T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.guide.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.guide.intro));

        section.appendChild(listPanel(t.guide.systemsTitle, t.guide.systems, true));
        section.appendChild(listPanel(t.guide.waterTitle, t.guide.water, false));
        section.appendChild(listPanel(t.guide.nutrientTitle, t.guide.nutrient, false));
        section.appendChild(listPanel(t.guide.firstTitle, t.guide.first, false));
        return section;
    }

    function listPanel(title, items, withNames) {
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

    function renderReferences() {
        const t = T();
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

    /* ------------------------------------------------------------------ */
    /* Journal tab                                                         */
    /* ------------------------------------------------------------------ */

    function loadJournal() {
        try {
            return Journal.hydrate(JSON.parse(localStorage.getItem(JOURNAL_STORAGE_KEY) || '{}'));
        } catch (err) {
            console.warn('Journal load failed', err);
            return { grows: [] };
        }
    }

    function saveJournal() {
        try {
            localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(state.journal));
        } catch (err) {
            console.warn('Journal save failed', err);
        }
    }

    function renderJournal() {
        const active = state.journal.grows.find((g) => g.id === state.journalSelectedId);
        if (active) {
            return renderGrowDetail(active);
        }
        return renderJournalOverview();
    }

    function renderJournalOverview() {
        const t = T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.journal.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.journal.intro));

        const actions = UIAPI.el('div', 'journal-actions');
        const newBtn = UIAPI.el('button', 'btn primary', t.journal.newGrow);
        newBtn.type = 'button';
        newBtn.addEventListener('click', () => {
            state.journalCreateOpen = !state.journalCreateOpen;
            render();
        });
        actions.appendChild(newBtn);
        if (state.journal.grows.length > 0) {
            const exportBtn = UIAPI.el('button', 'btn', t.journal.detail.csv);
            exportBtn.type = 'button';
            exportBtn.addEventListener('click', exportCsv);
            actions.appendChild(exportBtn);
        }
        section.appendChild(actions);

        if (state.journalCreateOpen) {
            section.appendChild(renderCreateGrowForm());
        }

        if (state.journal.grows.length === 0) {
            const empty = UIAPI.el('div', 'panel journal-empty');
            empty.appendChild(UIAPI.el('h3', 'panel-title', t.journal.emptyTitle));
            empty.appendChild(UIAPI.el('p', 'note-text', t.journal.emptyHint));
            section.appendChild(empty);
        } else {
            const grid = UIAPI.el('div', 'grow-grid');
            state.journal.grows
                .slice()
                .sort((a, b) => (a.startIso < b.startIso ? -1 : a.startIso > b.startIso ? 1 : 0))
                .forEach((grow) => grid.appendChild(renderGrowCard(grow)));
            section.appendChild(grid);
        }

        section.appendChild(UIAPI.el('p', 'note-text', t.journal.storageNote));
        return section;
    }

    function renderCreateGrowForm() {
        const t = T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.journal.newGrow));

        const cropSelect = UIAPI.el('select', 'field');
        cropSelect.setAttribute('aria-label', t.journal.form.crop);
        const placeholder = UIAPI.el('option', null, '');
        placeholder.value = '';
        cropSelect.appendChild(placeholder);
        cropOptions().forEach((opt) => cropSelect.appendChild(opt));

        const nameInput = UIAPI.el('input', 'field');
        nameInput.type = 'text';
        nameInput.setAttribute('aria-label', t.journal.form.name);

        const startInput = UIAPI.el('input', 'field');
        startInput.type = 'date';
        startInput.value = todayIso();
        startInput.setAttribute('aria-label', t.journal.form.start);

        const systemSelect = UIAPI.el('select', 'field');
        systemSelect.setAttribute('aria-label', t.journal.form.system);
        const sysPlaceholder = UIAPI.el('option', null, '');
        sysPlaceholder.value = '';
        systemSelect.appendChild(sysPlaceholder);
        Object.keys(t.crop.systems).forEach((key) => {
            const opt = UIAPI.el('option', null, t.crop.systems[key]);
            opt.value = key;
            systemSelect.appendChild(opt);
        });

        const notesInput = UIAPI.el('input', 'field');
        notesInput.type = 'text';
        notesInput.setAttribute('aria-label', t.journal.form.notes);

        const submit = UIAPI.el('button', 'btn primary', t.journal.form.create);
        submit.type = 'button';
        submit.addEventListener('click', () => {
            if (!cropSelect.value) {
                return;
            }
            const grow = Journal.createGrow({
                cropId: cropSelect.value,
                name: nameInput.value,
                startIso: startInput.value,
                system: systemSelect.value,
                notes: notesInput.value
            });
            state.journal.grows.push(grow);
            state.journalSelectedId = grow.id;
            state.journalCreateOpen = false;
            saveJournal();
            render();
        });

        wrap.appendChild(fieldRow(t.journal.form.crop, cropSelect));
        wrap.appendChild(fieldRow(t.journal.form.name, nameInput));
        wrap.appendChild(fieldRow(t.journal.form.start, startInput));
        wrap.appendChild(fieldRow(t.journal.form.system, systemSelect));
        wrap.appendChild(fieldRow(t.journal.form.notes, notesInput));
        wrap.appendChild(submit);
        return wrap;
    }

    function sortByDate(readings) {
        return readings.slice().sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0));
    }

    function latestReading(grow) {
        const sorted = sortByDate(grow.readings);
        return sorted.length ? sorted[sorted.length - 1] : null;
    }

    function dayLabel(grow) {
        const t = T();
        const day = Math.max(0, Journal.daysBetween(grow.startIso, todayIso()));
        return t.journal.detail.day + ' ' + day;
    }

    function statusPill(status) {
        const t = T();
        const cls = status === 'ok' ? 'pill-ok' : status === 'low' || status === 'high' ? 'pill-warn' : 'pill-muted';
        return UIAPI.el('span', 'status-pill ' + cls,
            status === 'none' ? t.journal.status.none : t.journal.status[status]);
    }

    function renderGrowCard(grow) {
        const t = T();
        const crop = CROP_DATA.find((c) => c.id === grow.cropId);
        const card = UIAPI.el('button', 'grow-card');
        card.addEventListener('click', () => {
            state.journalSelectedId = grow.id;
            render();
        });

        const head = UIAPI.el('div', 'grow-card-head');
        head.appendChild(UIAPI.el('span', 'crop-emoji', crop ? crop.emoji : '\u26a0\ufe0f'));
        const nameWrap = UIAPI.el('div', 'grow-card-name');
        nameWrap.appendChild(UIAPI.el('h3', null, grow.name || cropName(crop)));
        const bits = [cropName(crop), UIAPI.formatDate(grow.startIso, state.lang)];
        if (grow.system) {
            bits.push(t.crop.systems[grow.system] || grow.system);
        }
        nameWrap.appendChild(UIAPI.el('span', 'crop-card-latin', bits.join(' \u00b7 ')));
        head.appendChild(nameWrap);
        card.appendChild(head);

        const meta = UIAPI.el('div', 'grow-card-meta');
        meta.appendChild(UIAPI.el('span', 'badge', dayLabel(grow)));
        const latest = latestReading(grow);
        if (latest) {
            const assess = Journal.assessReading(crop, latest);
            meta.appendChild(statRow(t.journal.table.ec, assess.ec.status));
            meta.appendChild(statRow(t.journal.table.ph, assess.ph.status));
        }
        const count = grow.readings.length;
        meta.appendChild(UIAPI.el('span', 'crop-card-stat',
            count + ' ' + (count === 1 ? t.journal.detail.readingsCountSingular : t.journal.detail.readingsCountPlural)));
        card.appendChild(meta);
        return card;
    }

    function statRow(label, status) {
        const row = UIAPI.el('span', 'crop-card-stat');
        row.textContent = label + ' ';
        row.appendChild(statusPill(status));
        return row;
    }

    function renderGrowDetail(grow) {
        const t = T();
        const crop = CROP_DATA.find((c) => c.id === grow.cropId);
        const section = UIAPI.el('section', 'tab-panel');

        const back = UIAPI.el('button', 'btn ghost', t.journal.detail.back);
        back.type = 'button';
        back.addEventListener('click', () => {
            state.journalSelectedId = null;
            render();
        });
        section.appendChild(back);

        const header = UIAPI.el('div', 'grow-detail-header');
        header.appendChild(UIAPI.el('span', 'crop-emoji large', crop ? crop.emoji : '\u26a0\ufe0f'));
        const main = UIAPI.el('div', 'grow-header-main');
        const titleLine = UIAPI.el('div', 'grow-title-line');
        const nameInput = UIAPI.el('input', 'field grow-name');
        nameInput.type = 'text';
        nameInput.value = grow.name;
        nameInput.setAttribute('aria-label', t.journal.form.name);
        nameInput.addEventListener('change', () => {
            grow.name = nameInput.value.trim();
            saveJournal();
        });
        titleLine.appendChild(nameInput);
        const delGrow = confirmButton(
            t.journal.detail.deleteGrow, t.journal.detail.confirm, t.journal.detail.cancel,
            () => {
                state.journal.grows = state.journal.grows.filter((g) => g.id !== grow.id);
                state.journalSelectedId = null;
                saveJournal();
                render();
            }
        );
        titleLine.appendChild(delGrow);
        main.appendChild(titleLine);
        const subBits = [(crop ? cropName(crop) : grow.cropId),
            t.journal.detail.started + ' ' + UIAPI.formatDate(grow.startIso, state.lang),
            dayLabel(grow)];
        if (grow.system) {
            subBits.push(t.crop.systems[grow.system] || grow.system);
        }
        main.appendChild(UIAPI.el('span', 'crop-card-latin', subBits.join(' \u00b7 ')));
        header.appendChild(main);
        section.appendChild(header);

        const actions = UIAPI.el('div', 'journal-actions');
        const csvBtn = UIAPI.el('button', 'btn', t.journal.detail.csv);
        csvBtn.type = 'button';
        csvBtn.addEventListener('click', exportCsv);
        actions.appendChild(csvBtn);
        section.appendChild(actions);

        section.appendChild(readingForm(grow, crop));
        section.appendChild(readingsPanel(grow, crop));
        return section;
    }

    function confirmButton(initialLabel, confirmLabel, cancelLabel, onConfirm) {
        const btn = UIAPI.el('button', 'btn danger');
        btn.type = 'button';
        btn.textContent = initialLabel;
        btn.addEventListener('click', () => {
            if (btn.textContent === confirmLabel) {
                onConfirm();
                return;
            }
            btn.textContent = confirmLabel;
            const existing = btn.nextElementSibling;
            if (!existing || !existing.classList.contains('confirm-cancel')) {
                const cancel = UIAPI.el('button', 'btn confirm-cancel', cancelLabel);
                cancel.type = 'button';
                cancel.addEventListener('click', () => {
                    btn.textContent = initialLabel;
                    cancel.remove();
                });
                btn.parentNode.insertBefore(cancel, btn.nextSibling);
            }
        });
        return btn;
    }

    function updateStageHint(hintEl, crop, stageKey) {
        const t = T();
        const stage = crop && crop.stages.find((s) => s.key === stageKey);
        if (!stage) {
            hintEl.textContent = '';
            return;
        }
        const stageLabel = T().crop.stages[stageKey] || stageKey;
        hintEl.textContent = t.journal.formReading.target.replace('{stage}', stageLabel) + ' ' +
            t.crop.ec + ' ' + UIAPI.formatRange(stage.ec, state.lang, 1) + ' \u00b7 ' +
            t.crop.ph + ' ' + UIAPI.formatRange(stage.ph, state.lang, 1);
    }

    function readingForm(grow, crop) {
        const t = T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.journal.detail.reading));

        const stageSelect = UIAPI.el('select', 'field');
        stageSelect.setAttribute('aria-label', t.journal.formReading.stage);
        stageOptions(crop).forEach((opt) => stageSelect.appendChild(opt));
        if (crop && crop.stages.length) {
            stageSelect.value = crop.stages[0].key;
        }

        const hint = UIAPI.el('p', 'note-text', '');
        updateStageHint(hint, crop, stageSelect.value);
        stageSelect.addEventListener('change', () => updateStageHint(hint, crop, stageSelect.value));

        const dateInput = UIAPI.el('input', 'field');
        dateInput.type = 'date';
        dateInput.value = todayIso();
        dateInput.setAttribute('aria-label', t.journal.formReading.date);

        const ecInput = numberFieldInput(t.journal.formReading.ec, '0.01');
        const phInput = numberFieldInput(t.journal.formReading.ph, '0.01');
        const wtInput = numberFieldInput(t.journal.formReading.waterTemp, '0.1');
        const atInput = numberFieldInput(t.journal.formReading.airTemp, '0.1');
        const notesInput = UIAPI.el('input', 'field');
        notesInput.type = 'text';
        notesInput.setAttribute('aria-label', t.journal.formReading.notes);

        const submit = UIAPI.el('button', 'btn primary', t.journal.formReading.submit);
        submit.type = 'button';
        submit.addEventListener('click', () => {
            Journal.addReading(grow, {
                dateIso: dateInput.value,
                stage: stageSelect.value,
                ec: ecInput.querySelector('input').value,
                ph: phInput.querySelector('input').value,
                waterTemp: wtInput.querySelector('input').value,
                airTemp: atInput.querySelector('input').value,
                notes: notesInput.value
            });
            saveJournal();
            render();
        });

        wrap.appendChild(fieldRow(t.journal.formReading.stage, stageSelect));
        wrap.appendChild(hint);
        wrap.appendChild(fieldRow(t.journal.formReading.date, dateInput));
        wrap.appendChild(ecInput);
        wrap.appendChild(phInput);
        wrap.appendChild(wtInput);
        wrap.appendChild(atInput);
        wrap.appendChild(fieldRow(t.journal.formReading.notes, notesInput));
        wrap.appendChild(submit);
        return wrap;
    }

    function readingsPanel(grow, crop) {
        const t = T();
        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.journal.readingsTitle));

        if (grow.readings.length === 0) {
            wrap.appendChild(UIAPI.el('p', 'note-text', t.journal.noReadings));
            return wrap;
        }

        const summary = UIAPI.el('div', 'journal-summary');
        ['ec', 'ph'].forEach((field) => {
            const stat = Journal.statOverLast(grow, crop, field, 5);
            if (stat.hasData) {
                summary.appendChild(UIAPI.el('span', 'status-pill pill-muted',
                    t.journal.summaryInRange
                        .replace('{field}', t.journal.fieldLabels[field])
                        .replace('{in}', stat.inRange)
                        .replace('{total}', stat.total)));
            }
        });
        wrap.appendChild(summary);

        wrap.appendChild(trendPanel(grow, crop));
        wrap.appendChild(readingsTable(grow, crop));
        return wrap;
    }

    function trendPanel(grow, crop) {
        const t = T();
        const wrap = UIAPI.el('div', 'trend-panel');
        wrap.appendChild(UIAPI.el('h4', 'calc-result-title', t.journal.trendTitle));
        const latest = latestReading(grow);
        const stageKey = latest ? latest.stage : (crop && crop.stages.length ? crop.stages[0].key : '');
        const stage = crop && stageKey ? (crop.stages.find((s) => s.key === stageKey) || crop.stages[0]) : null;
        ['ec', 'ph'].forEach((field) => {
            wrap.appendChild(sparklineFor(grow, stage, field));
        });
        return wrap;
    }

    function sparklineFor(grow, stage, field) {
        const t = T();
        const label = t.journal.fieldLabels[field];
        const values = sortByDate(grow.readings).map((r) => r[field]).filter((v) => v !== null);
        if (values.length < 2) {
            return UIAPI.el('p', 'note-text', label + ': ' + t.journal.trendTooFew);
        }

        let min = Math.min.apply(null, values);
        let max = Math.max.apply(null, values);
        const band = stage && Array.isArray(stage[field]) ? stage[field] : null;
        if (band) {
            min = Math.min(min, band[0]);
            max = Math.max(max, band[1]);
        }
        const spark = Journal.sparklinePoints(values, 300, 80, min, max);

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'trend-svg');
        svg.setAttribute('viewBox', '0 0 300 80');
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('aria-hidden', 'true');

        if (band) {
            const yMin = Math.round(80 - ((band[0] - spark.min) / (spark.max - spark.min)) * 80);
            const yMax = Math.round(80 - ((band[1] - spark.min) / (spark.max - spark.min)) * 80);
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', '0');
            rect.setAttribute('width', '300');
            rect.setAttribute('y', String(Math.min(yMin, yMax)));
            rect.setAttribute('height', String(Math.max(1, Math.abs(yMax - yMin))));
            rect.setAttribute('class', 'trend-band');
            svg.appendChild(rect);
        }

        const polyline = document.createElementNS(SVG_NS, 'polyline');
        polyline.setAttribute('class', 'trend-line');
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('points', spark.points.map((p) => p.x + ',' + p.y).join(' '));
        svg.appendChild(polyline);
        spark.points.forEach((p) => {
            const dot = document.createElementNS(SVG_NS, 'circle');
            dot.setAttribute('cx', String(p.x));
            dot.setAttribute('cy', String(p.y));
            dot.setAttribute('r', '2.5');
            dot.setAttribute('class', 'trend-dot');
            svg.appendChild(dot);
        });

        const wrap = UIAPI.el('div', 'trend-block');
        const title = UIAPI.el('p', 'note-text');
        title.appendChild(UIAPI.el('b', null, label + ': '));
        title.appendChild(document.createTextNode(UIAPI.formatNumber(values[values.length - 1], state.lang, 1)));
        wrap.appendChild(title);
        wrap.appendChild(svg);
        return wrap;
    }

    function readingsTable(grow, crop) {
        const t = T();
        const table = UIAPI.el('table', 'data-table');
        const thead = UIAPI.el('thead');
        const headRow = UIAPI.el('tr');
        [t.journal.table.date, t.journal.table.stage, t.journal.table.ec,
            t.journal.table.ph, t.journal.table.waterTemp, t.journal.table.airTemp,
            t.journal.table.notes, ''].forEach((h) => headRow.appendChild(UIAPI.el('th', null, h)));
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = UIAPI.el('tbody');
        sortByDate(grow.readings).reverse().forEach((r) => {
            const tr = UIAPI.el('tr');
            tr.appendChild(UIAPI.el('td', null, UIAPI.formatDate(r.dateIso, state.lang)));
            tr.appendChild(UIAPI.el('td', null, t.crop.stages[r.stage] || r.stage));
            const assess = Journal.assessReading(crop, r);
            const ecCell = UIAPI.el('td');
            ecCell.appendChild(statusPill(assess.ec.status));
            tr.appendChild(ecCell);
            const phCell = UIAPI.el('td');
            phCell.appendChild(statusPill(assess.ph.status));
            tr.appendChild(phCell);
            tr.appendChild(UIAPI.el('td', null, r.waterTemp === null ? '\u2014' : UIAPI.formatNumber(r.waterTemp, state.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, r.airTemp === null ? '\u2014' : UIAPI.formatNumber(r.airTemp, state.lang, 1)));
            tr.appendChild(UIAPI.el('td', null, r.notes || ''));
            const delCell = UIAPI.el('td');
            delCell.appendChild(confirmButton(
                t.journal.detail.deleteReading, t.journal.detail.confirm, t.journal.detail.cancel,
                () => {
                    grow.readings = grow.readings.filter((x) => x.id !== r.id);
                    saveJournal();
                    render();
                }
            ));
            tr.appendChild(delCell);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        return table;
    }

    function exportCsv() {
        try {
            const csv = Journal.toCsv(state.journal.grows, (id) => {
                const crop = CROP_DATA.find((c) => c.id === id);
                return crop ? crop.names.en : id;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = UIAPI.el('a');
            link.href = url;
            link.download = 'hydroponics-journal.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.warn('CSV export failed', err);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Small field builders                                                */
    /* ------------------------------------------------------------------ */

    function fieldRow(labelText, control) {
        const row = UIAPI.el('label', 'field-row');
        row.appendChild(UIAPI.el('span', 'field-label', labelText));
        row.appendChild(control);
        return row;
    }

    function numberField(labelText, onChange) {
        const input = UIAPI.el('input', 'field');
        input.type = 'number';
        input.min = '0';
        input.step = 'any';
        input.addEventListener('input', (e) => onChange(e.target.value));
        return fieldRow(labelText, input);
    }

    function numberFieldInput(labelText, step) {
        const input = UIAPI.el('input', 'field');
        input.type = 'number';
        input.min = '0';
        input.step = step || 'any';
        input.setAttribute('aria-label', labelText);
        return fieldRow(labelText, input);
    }

    function parseNumber(raw) {
        return Number(String(raw).replace(',', '.'));
    }

    /* ------------------------------------------------------------------ */
    /* Boot                                                               */
    /* ------------------------------------------------------------------ */

    function init() {
        state.journal = loadJournal();
        ['crops', 'calculators', 'guide', 'references', 'journal'].forEach((tab) => {
            const btn = document.querySelector('.nav-tab[data-tab="' + tab + '"]');
            if (btn) {
                btn.addEventListener('click', () => switchTab(tab));
            }
        });

        document.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.addEventListener('click', () => switchLanguage(btn.dataset.lang));
        });

        updateHeader();
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();