/**
 * Nutrient line presets for the dosing calculator.
 *
 * `referenceEc` is the EC (mS/cm) that the listed per-liter amounts produce
 * above clean (RO/distilled) water. The calculator scales these amounts
 * linearly to hit a target EC minus your source-water EC. These are
 * well-known home-grower ratios, encoded here because they are widely reused;
 * always verify against the label of the products you actually own.
 *
 * Units: `g` = grams per liter, `mL` = milliliters per liter.
 */
const NUTRIENT_LINES = [
    {
        id: 'masterblend',
        name: 'MasterBlend Tomato 4-18-38 (A-B-C)',
        unit: 'g',
        referenceEc: 1.4,
        parts: [
            { product: 'MasterBlend 4-18-38', amount: 0.6, unit: 'g' },
            { product: 'Calcium Nitrate', amount: 0.6, unit: 'g' },
            { product: 'Epsom Salt (MgSO\u2084)', amount: 0.3, unit: 'g' }
        ]
    },
    {
        id: 'jacks',
        name: 'Jack\u2019s Professional 5-12-26 (A-B)',
        unit: 'g',
        referenceEc: 1.4,
        parts: [
            { product: 'Jack\u2019s 5-12-26', amount: 0.5, unit: 'g' },
            { product: 'Calcium Nitrate', amount: 0.63, unit: 'g' }
        ]
    },
    {
        id: 'flora',
        name: 'General Hydroponics Flora Series',
        unit: 'mL',
        referenceEc: 1.3,
        parts: [
            { product: 'FloraMicro', amount: 2.5, unit: 'mL' },
            { product: 'FloraGro', amount: 2.5, unit: 'mL' },
            { product: 'FloraBloom', amount: 1.25, unit: 'mL' }
        ]
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NUTRIENT_LINES;
}