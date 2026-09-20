/**
 * Data sources cited throughout the crop database.
 * Structure: [{ id, publisher, title, year, type, url }]
 */
const REFERENCES = [
    {
        id: 'cornell-cea',
        publisher: 'Cornell CEA',
        title: 'Controlled Environment Agriculture program — crop handbooks and \u201cA Recipe for Hydroponic Success\u201d',
        year: 2022,
        type: 'handbook',
        url: 'https://cea.cals.cornell.edu/crops/'
    },
    {
        id: 'cornell-lettuce-handbook',
        publisher: 'Cornell CEA',
        title: 'Hydroponic Lettuce Handbook (Mattson & Lieth)',
        year: 2021,
        type: 'handbook',
        url: 'https://cea.cals.cornell.edu/crops/'
    },
    {
        id: 'vt-spes466',
        publisher: 'Virginia Tech CEA',
        title: 'SPES-466: Hydroponic Production of Edible Crops: System and Crop Comparisons',
        year: 2023,
        type: 'university',
        url: 'https://ext.vt.edu/content/pubs_ext_vt_edu/en/SPES/spes-466/spes-466.html'
    },
    {
        id: 'penn-state',
        publisher: 'Penn State Extension',
        title: 'Hydroponics — nutrient solutions and crop production guidance',
        year: 2023,
        type: 'university',
        url: 'https://extension.psu.edu'
    },
    {
        id: 'uf-ifas',
        publisher: 'UF/IFAS',
        title: 'Hydroponic tomato, cucumber and strawberry production resources',
        year: 2023,
        type: 'university',
        url: 'https://ifas.ufl.edu'
    },
    {
        id: 'egro-alerts',
        publisher: 'eGro (WUR / produce supply chain)',
        title: 'eGro Alerts — symptoms of nutrient deficiencies and disorders (lettuce, basil)',
        year: 2022,
        type: 'industry'
    },
    {
        id: 'sonneveld',
        publisher: 'C. Sonneveld & N. Straver',
        title: 'Nutrient Solutions for Greenhouse Crops',
        year: 1994,
        type: 'book'
    },
    {
        id: 'howhydroponics-chart',
        publisher: 'howhydroponics.com',
        title: 'EC, pH and PPM Reading Chart for 80+ hydroponic crops (community-compiled reference)',
        year: 2021,
        type: 'community',
        url: 'https://howhydroponics.com/wp-content/uploads/2021/07/EC-pH-and-PPM-Reading-Chart-by-howhydroponics.pdf'
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = REFERENCES;
}