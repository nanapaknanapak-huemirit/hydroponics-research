/**
 * Insights layer.
 *
 * A read-only summary that turns the logged grows (persisted by the Journal
 * layer under `hydroponics.journal.v1`) into plain-language conclusions: per
 * field the latest value vs the crop target, trend direction, in-range stats
 * and the harvest countdown. All verdict logic lives in the pure Insights
 * model; this file is DOM only.
 */
(function () {
    'use strict';

    const JOURNAL_STORAGE_KEY = 'hydroponics.journal.v1';

    function render(ctx) {
        const t = ctx.T();
        const section = UIAPI.el('section', 'tab-panel');
        section.appendChild(UIAPI.el('h2', null, t.insights.title));
        section.appendChild(UIAPI.el('p', 'subtitle', t.insights.subtitle));

        const grows = readJournal(ctx);
        if (grows.length === 0) {
            const empty = UIAPI.el('div', 'panel');
            empty.appendChild(UIAPI.el('h3', 'panel-title', t.insights.emptyTitle));
            empty.appendChild(UIAPI.el('p', 'note-text', t.insights.emptyHint));
            section.appendChild(empty);
            return section;
        }

        grows.slice().sort((a, b) => (a.startIso < b.startIso ? -1 : a.startIso > b.startIso ? 1 : 0))
            .forEach((grow) => {
                const crop = ctx.services.findCrop(CROP_DATA, grow.cropId);
                if (crop) {
                    section.appendChild(renderCard(ctx, grow, crop));
                }
            });
        return section;
    }

    function readJournal(ctx) {
        return Journal.hydrate(ctx.storage.load(JOURNAL_STORAGE_KEY)).grows;
    }

    function renderCard(ctx, grow, crop) {
        const t = ctx.T();
        const verdict = Insights.conclude(grow, crop, ctx.services.todayIso());

        const section = UIAPI.el('div', 'panel');
        const header = UIAPI.el('div', 'grow-detail-header');
        header.appendChild(UIAPI.el('span', 'crop-emoji large', crop.emoji || '\u26a0\ufe0f'));
        const main = UIAPI.el('div', 'grow-header-main');
        const titleLine = UIAPI.el('div', 'grow-title-line');
        titleLine.appendChild(UIAPI.el('b', null, grow.name || ctx.services.cropName(crop, ctx.lang)));
        main.appendChild(titleLine);

        const bits = [ctx.services.cropName(crop, ctx.lang)];
        if (verdict.stageKey) {
            bits.push(t.crop.stages[verdict.stageKey] || verdict.stageKey);
        }
        bits.push(dayLabel(ctx, verdict.daysActive));
        if (verdict.readingsCount > 0) {
            bits.push(verdict.readingsCount + ' ' +
                (verdict.readingsCount === 1 ? t.insights.readingSingular : t.insights.readingPlural));
        }
        main.appendChild(UIAPI.el('span', 'crop-card-latin', bits.join(' \u00b7 ')));
        header.appendChild(main);
        section.appendChild(header);

        if (!verdict.hasData) {
            section.appendChild(UIAPI.el('p', 'note-text', t.insights.noReadings));
            return section;
        }

        section.appendChild(fieldsPanel(ctx, verdict));
        section.appendChild(harvestLine(ctx, verdict.harvest));
        return section;
    }

    function dayLabel(ctx, daysActive) {
        const t = ctx.T();
        return t.insights.day + ' ' + daysActive;
    }

    function fieldsPanel(ctx, verdict) {
        const t = ctx.T();
        const table = UIAPI.el('table', 'data-table');
        const thead = UIAPI.el('thead');
        const headRow = UIAPI.el('tr');
        [t.journal.table.stage, t.journal.table.ec, t.journal.table.ph,
            t.journal.table.waterTemp, t.journal.table.airTemp].forEach((h) => {
            headRow.appendChild(UIAPI.el('th', null, h));
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = UIAPI.el('tbody');
        const tr = UIAPI.el('tr');
        tr.appendChild(UIAPI.el('td', null, t.crop.stages[verdict.stageKey] || verdict.stageKey));

        Insights.MONITORED_FIELDS.concat(Insights.CLIMATE_FIELDS).forEach((key) => {
            const field = verdict.fields[key];
            const cell = UIAPI.el('td');
            cell.appendChild(statusPill(ctx, field.status));
            if (field.trend) {
                cell.appendChild(trendText(ctx, key, field.trend));
            }
            cell.appendChild(valueLine(ctx, field));
            tr.appendChild(cell);
        });
        tbody.appendChild(tr);
        table.appendChild(tbody);

        const wrap = UIAPI.el('div', 'panel');
        wrap.appendChild(UIAPI.el('h3', 'panel-title', t.insights.latestTitle));
        wrap.appendChild(table);
        wrap.appendChild(inRangeSummary(ctx, verdict));
        return wrap;
    }

    function statusPill(ctx, status) {
        const t = ctx.T();
        const cls = status === 'ok' ? 'pill-ok' : status === 'low' || status === 'high' ? 'pill-warn' : 'pill-muted';
        return UIAPI.el('span', 'status-pill ' + cls,
            status === 'none' ? t.journal.status.none : t.journal.status[status]);
    }

    function trendText(ctx, key, trend) {
        const t = ctx.T();
        const label = key === 'ec' ? t.journal.fieldLabels.ec : key === 'ph' ?
            t.journal.fieldLabels.ph : key === 'waterTemp' ? t.journal.table.waterTemp : t.journal.table.airTemp;
        const dir = trend.direction === 'up' ? t.insights.trendUp :
            trend.direction === 'down' ? t.insights.trendDown : t.insights.trendFlat;
        const delta = UIAPI.formatNumber(Math.abs(trend.delta), ctx.lang, 2);
        return UIAPI.el('span', 'note-text',
            dir.replace('{field}', label).replace('{delta}', delta));
    }

    function valueLine(ctx, field) {
        if (field.value === null) {
            return UIAPI.el('p', 'note-text', '\u2014');
        }
        const val = UIAPI.formatNumber(field.value, ctx.lang, 1);
        const target = field.target ? UIAPI.formatRange(field.target, ctx.lang, 1) : null;
        return UIAPI.el('p', 'note-text',
            val + (target ? ' / ' + target : ''));
    }

    function inRangeSummary(ctx, verdict) {
        const t = ctx.T();
        const summary = UIAPI.el('div', 'journal-summary');
        Insights.MONITORED_FIELDS.forEach((key) => {
            const stat = verdict.fields[key].inRange;
            if (stat.hasData) {
                summary.appendChild(UIAPI.el('span', 'status-pill pill-muted',
                    t.journal.summaryInRange
                        .replace('{field}', t.journal.fieldLabels[key])
                        .replace('{in}', stat.inRange)
                        .replace('{total}', stat.total)));
            }
        });
        return summary;
    }

    function harvestLine(ctx, harvest) {
        const t = ctx.T();
        if (!harvest.hasRange) {
            return UIAPI.el('p', 'note-text', '');
        }
        const range = UIAPI.formatRange([harvest.minDays, harvest.maxDays], ctx.lang, 0) + ' ' + t.insights.days;
        let text;
        if (harvest.phase === 'before') {
            text = t.insights.harvestBefore
                .replace('{days}', String(Math.max(0, harvest.daysToWindow)))
                .replace('{range}', range);
        } else if (harvest.phase === 'window') {
            text = t.insights.harvestWindow.replace('{range}', range);
        } else {
            text = t.insights.harvestPast.replace('{range}', range);
        }
        return UIAPI.el('p', 'note-text', text);
    }

    const layer = {
        id: 'insights',
        labelKey: 'insights',
        render: render
    };

    Core.registerLayer(layer);
})();