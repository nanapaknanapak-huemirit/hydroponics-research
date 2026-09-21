/**
 * Pure system-designer model. No DOM, no i18n — composes Calc + PLANNER into a
 * structured grow plan the layer can render: spacing → plant count, reservoir
 * estimate, weekly solution demand, nutrient dosing, light check, stagger
 * schedule and a user-cost economics summary. Costs are never baked in here;
 * they come from the caller.
 */
(function (root) {
    'use strict';

    function calc() {
        return typeof module !== 'undefined' && module.exports
            ? require('./calc.js')
            : root.Calc;
    }

    function planner() {
        return typeof module !== 'undefined' && module.exports
            ? require('../data/planner.js').PLANNER
            : PLANNER;
    }

    function cropDb() {
        return typeof module !== 'undefined' && module.exports
            ? require('../data/crops.js').CROP_DATA
            : CROP_DATA;
    }

    function recipeLines() {
        return typeof module !== 'undefined' && module.exports
            ? require('../data/presets.js')
            : NUTRIENT_LINES;
    }

    function findCrop(cropId) {
        return cropDb().find((c) => c.id === cropId) || null;
    }

    function findSystemType(typeId) {
        return planner().systemTypes.find((s) => s.id === typeId) || null;
    }

    function toNum(value) {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        const parsed = Number(String(value).trim().replace(',', '.'));
        return Number.isNaN(parsed) ? null : parsed;
    }

    /**
     * Build a complete grow plan from user inputs.
     * @param {Object} opts - {cropId, systemType, areaW, areaL, spacing,
     *   reservoirL?, recipeId, targetEc, sourceEc,
     *   harvestsPerWeek?, weeksForward?, ppfd?, lightHours?,
     *   economics?: {seedCostPerPlant, pricePerKg}}
     * @returns {Object} normalized plan
     */
    function buildPlan(opts) {
        const o = opts === null || typeof opts !== 'object' ? {} : opts;
        const crop = findCrop(String(o.cropId || ''));
        const type = findSystemType(String(o.systemType || ''));
        const areaW = toNum(o.areaW);
        const areaL = toNum(o.areaL);
        const spacing = toNum(o.spacing);
        const spacingOrCrop = spacing || (crop && crop.spacing ? crop.spacing[0] : null);

        const plantCount = crop && spacingOrCrop
            ? calc().plantCount(areaW, areaL, spacingOrCrop)
            : 0;

        const rootsPerPlant = type ? type.rootsVolumeL : null;
        const weeklyPerPlant = type ? type.litresPerWeekPerPlant : null;
        const estimatedReservoir = plantCount && rootsPerPlant
            ? calc().reservoirEstimate(plantCount, rootsPerPlant)
            : null;
        const reservoirL = toNum(o.reservoirL) || estimatedReservoir;
        const weeklySolutionL = plantCount && weeklyPerPlant
            ? calc().weeklySolutionDemand(plantCount, weeklyPerPlant)
            : null;

        const line = recipeLine(String(o.recipeId || ''));
        const dosing = line && reservoirL
            ? calc().scaleLineAmounts(line, toNum(o.targetEc), toNum(o.sourceEc), reservoirL)
            : null;

        const light = buildLight(crop, o);

        const startIso = /^\d{4}-\d{2}-\d{2}$/.test(String(o.startIso || '')) ? String(o.startIso) : null;
        const stagger = crop && startIso && toNum(o.harvestsPerWeek) && toNum(o.weeksForward)
            ? calc().staggerPlantings(crop, startIso, toNum(o.harvestsPerWeek), toNum(o.weeksForward))
            : [];

        const yieldEntry = crop ? planner().cropYields[crop.id] : null;
        const economics = buildEconomics(plantCount, yieldEntry ? yieldEntry.kgPerPlant : null, o.economics);

        return {
            cropId: crop ? crop.id : null,
            cropName: crop ? crop.names : null,
            systemType: type ? type.id : null,
            systemName: type ? type.id : null,
            areaW: areaW,
            areaL: areaL,
            spacing: spacingOrCrop,
            plantCount: plantCount,
            rootsPerPlant: rootsPerPlant,
            weeklyPerPlant: weeklyPerPlant,
            estimatedReservoir: estimatedReservoir,
            reservoirL: reservoirL,
            weeklySolutionL: weeklySolutionL,
            dosing: dosing,
            light: light,
            stagger: stagger,
            yield: yieldEntry ? yieldEntry.kgPerPlant : null,
            economics: economics,
            complete: Boolean(crop && type && areaW && areaL && spacingOrCrop)
        };
    }

    function recipeLine(recipeId) {
        return recipeLines().find((l) => l.id === recipeId) || null;
    }

    function buildLight(crop, o) {
        if (!crop) {
            return null;
        }
        const ppfd = toNum(o.ppfd);
        const hours = toNum(o.lightHours);
        if (ppfd === null || hours === null) {
            return null;
        }
        const dli = calc().dliFromPpfd(ppfd, hours);
        const target = crop.climate && Array.isArray(crop.climate.dli) ? crop.climate.dli : null;
        const status = target ? journalLike().assessment(dli, target).status : 'none';
        return { ppfd: ppfd, hours: hours, dli: dli, target: target, status: status };
    }

    function journalLike() {
        return typeof module !== 'undefined' && module.exports
            ? require('./journal.js')
            : root.Journal;
    }

    function buildEconomics(plantCount, kgPerPlant, costs) {
        const c = costs && typeof costs === 'object' ? costs : {};
        const seedCost = toNum(c.seedCostPerPlant);
        const pricePerKg = toNum(c.pricePerKg);
        const yieldKg = plantCount && kgPerPlant ? Math.round(plantCount * kgPerPlant * 100) / 100 : null;
        const plantCost = seedCost !== null && plantCount ? Math.round(seedCost * plantCount * 100) / 100 : null;
        const revenue = pricePerKg !== null && yieldKg !== null ? Math.round(yieldKg * pricePerKg * 100) / 100 : null;
        const balance = revenue !== null && plantCost !== null ? Math.round((revenue - plantCost) * 100) / 100 : null;
        return {
            yieldKg: yieldKg,
            plantCost: plantCost,
            revenue: revenue,
            balance: balance,
            complete: yieldKg !== null && plantCost !== null && revenue !== null && balance !== null
        };
    }

    const Designer = {
        buildPlan: buildPlan,
        findCrop: findCrop,
        findSystemType: findSystemType
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = Designer;
    } else {
        root.Designer = Designer;
    }
})(typeof window !== 'undefined' ? window : globalThis);