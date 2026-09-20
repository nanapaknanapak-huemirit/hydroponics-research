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
        }
    };

    const T = () => UI_STRINGS[state.lang];
    const cropName = (crop) => crop.names[state.lang];
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

    function parseNumber(raw) {
        return Number(String(raw).replace(',', '.'));
    }

    /* ------------------------------------------------------------------ */
    /* Boot                                                               */
    /* ------------------------------------------------------------------ */

    function init() {
        ['crops', 'calculators', 'guide', 'references'].forEach((tab) => {
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