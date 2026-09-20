/**
 * User-interface translations. English and Dutch.
 * All on-screen copy lives here; no text is hardcoded in app.js/ui.js.
 */
const UI_STRINGS = {
    en: {
        appTitle: 'Hydro Research',
        appSubtitle: 'Hydroponic growing data & calculators for home growers',
        tabs: {
            crops: 'Crops',
            journal: 'Journal',
            calculators: 'Calculators',
            testing: 'Testing',
            calibration: 'Calibration',
            guide: 'Guide',
            references: 'References'
        },
        lang: {
            label: 'Language',
            en: 'English',
            nl: 'Nederlands'
        },
        disclaimer: 'Values are research-based starting points. Adjust to your water, cultivar, system and climate.',
        crops: {
            searchPlaceholder: 'Search crops…',
            categoryFilter: 'Category',
            categories: {
                all: 'All',
                leafy: 'Leafy greens',
                herbs: 'Herbs',
                fruiting: 'Fruiting',
                berries: 'Berries',
                root: 'Root'
            },
            countSingular: 'crop',
            countPlural: 'crops',
            noResults: 'No crops match your search.'
        },
        crop: {
            stages: {
                seedling: 'Seedling',
                vegetative: 'Vegetative',
                fruiting: 'Fruiting',
                mature: 'Mature'
            },
            stageLabel: 'Growth stage',
            ec: 'EC (mS/cm)',
            ph: 'pH range',
            ppm500: 'PPM (500 scale)',
            ppm700: 'PPM (700 scale)',
            climate: 'Climate',
            airTemp: 'Air temperature',
            waterTemp: 'Water temperature',
            humidity: 'Relative humidity',
            dli: 'Daily Light Integral (DLI)',
            photoperiod: 'Photoperiod',
            units: {
                celsius: '\u00b0C',
                humidity: '% RH',
                dli: 'mol/m\u00b2/day',
                hours: 'h/day',
                cm: 'cm'
            },
            growth: 'Growth',
            germination: 'Germination',
            daysToHarvest: 'Days to harvest',
            note: 'Note',
            spacing: 'Plant spacing',
            systemsTitle: 'Best-suited systems',
            systems: {
                nft: 'Nutrient Film Technique (NFT)',
                dwc: 'Deep Water Culture (DWC)',
                ebbFlow: 'Ebb & flow',
                drip: 'Drip',
                dutchBucket: 'Dutch bucket'
            },
            feedTitle: 'Feeding guidance',
            npkRatio: 'Elemental N:P:K ratio',
            recipesTitle: 'Nutrient line options',
            recipesLine: 'Line',
            troubleshooting: 'Troubleshooting',
            troubleSymptom: 'Symptom',
            troubleCause: 'Cause',
            troubleFix: 'Fix',
            notesTitle: 'Grower notes',
            sourcesTitle: 'Sources',
            backToList: '\u2190 Back to list'
        },
        calculators: {
            title: 'Calculators',
            subtitle: 'Quick, honest math for everyday growing decisions.',
            ecTitle: 'EC \u2194 PPM converter',
            ecDesc: 'Convert between electrical conductivity and PPM on the three common meter scales.',
            ecInput: 'EC (mS/cm)',
            ppm500: 'PPM (500 scale \u2014 Hanna, Bluelab)',
            ppm700: 'PPM (700 scale \u2014 Truncheon, HM Digital)',
            ppm640: 'PPM (640 scale \u2014 Eutech)',
            ecNote: 'Tip: subtract your source-water EC/PPM before comparing to a crop target.',
            doseTitle: 'Nutrient dosing calculator',
            doseDesc: 'Choose a crop, stage and nutrient line to get per-liter and per-reservoir amounts.',
            doseCrop: 'Crop',
            doseStage: 'Stage',
            doseLine: 'Nutrient line',
            doseVolume: 'Reservoir volume (L)',
            doseSourceEc: 'Source-water EC (usually 0.0\u20130.4)',
            doseTargetEc: 'Target EC (from the crop card)',
            doseBtn: 'Calculate',
            doseResultTitle: 'Amounts to mix in {volume} L',
            doseAddToReach: 'Add to reach \u2248{ec} mS/cm above your water',
            dosepH: 'Then adjust pH to the crop\u2019s stage range with pH up/down.',
            doseSource: 'Line presets encode common home ratios; verify against your product labels.',
            dliTitle: 'DLI / lighting calculator',
            dliDesc: 'Daily Light Integral (DLI) from PPFD and photoperiod.',
            dliCrop: 'Crop (DLI target)',
            dliPpfd: 'PPFD (\u00b5mol/m\u00b2/s)',
            dliHours: 'Photoperiod (h/day)',
            dliResult: 'DLI',
            dliTargetHint: 'Picked crop target: {range} mol/m\u00b2/day ({name})',
            dliBelow: 'Below target \u2014 raise PPFD or hours.',
            dliWithin: 'Within the target range.',
            dliAbove: 'Above target \u2014 watch for heat/light stress; reduce PPFD or hours.',
            planTitle: 'Crop & harvest planner',
            planDesc: 'Pick a crop and a start date to see expected timing windows.',
            planCrop: 'Crop',
            planStart: 'Start date',
            planPerWeek: 'Harvests per week',
            planWeeks: 'Plan ahead (weeks)',
            planGermination: 'Germination',
            planHarvest: 'Harvest window',
            planInfo: 'Dates are ranges based on published averages; actual timing depends on your system and season.'
        },
        journal: {
            title: 'Grow journal',
            intro: 'Log what you actually measure and see at a glance whether each reading sits inside your crop\u2019s stage targets.',
            overviewTitle: 'Your grows',
            newGrow: 'New grow',
            emptyTitle: 'No grows yet',
            emptyHint: 'Create a grow and start logging EC, pH and temperature against the crop\u2019s stage targets.',
            storageNote: 'Stored locally in your browser only. Export CSV to keep a copy; clearing your browser data wipes the journal.',
            growCountSingular: 'grow',
            growCountPlural: 'grows',
            noReadings: 'No readings yet \u2014 use the form above.',
            form: {
                crop: 'Crop',
                name: 'Name (optional)',
                start: 'Start date',
                system: 'System',
                notes: 'Notes (optional)',
                create: 'Create grow'
            },
            detail: {
                back: '\u2190 All grows',
                reading: 'Reading',
                deleteGrow: 'Delete grow',
                deleteReading: 'Delete',
                confirm: 'Confirm?',
                cancel: 'Cancel',
                csv: 'Export CSV',
                day: 'Day',
                started: 'Started',
                readingsCountSingular: 'reading',
                readingsCountPlural: 'readings'
            },
            formReading: {
                date: 'Date',
                stage: 'Growth stage',
                ec: 'EC (mS/cm)',
                ph: 'pH',
                waterTemp: 'Water temp (\u00b0C)',
                airTemp: 'Air temp (\u00b0C)',
                notes: 'Notes (optional)',
                submit: 'Log reading',
                target: 'Target for {stage}:'
            },
            readingsTitle: 'Readings',
            table: {
                date: 'Date',
                stage: 'Stage',
                ec: 'EC',
                ph: 'pH',
                waterTemp: 'Water',
                airTemp: 'Air',
                notes: 'Notes'
            },
            status: {
                ok: 'In range',
                low: 'Low',
                high: 'High',
                none: '\u2014'
            },
            summaryInRange: '{field} in range {in}/{total}',
            trendTitle: 'Trend',
            trendTooFew: 'Log at least two read readings to see a trend.',
            fieldLabels: {
                ec: 'EC',
                ph: 'pH'
            }
        },
        testing: {
            title: 'Testing',
            subtitle: 'A quick check of a single measurement against the crop\u2019s stage and climate targets, plus notes on meters and sampling.',
            crop: 'Crop',
            stage: 'Stage',
            ec: 'EC (mS/cm)',
            ph: 'pH',
            waterTemp: 'Water temp (\u00b0C)',
            airTemp: 'Air temp (\u00b0C)',
            selectHint: 'Pick a crop and stage, then measure. Each test line shows your value against the target and a live status.',
            summary: '{in} of {total} fields in range',
            metersTitle: 'Meters & calibration',
            meters: [
                { name: 'EC/PPM combo meter', text: 'covers most needs on a single probe; PPM is just a scale conversion, so keep yours and your checks on the same scale.' },
                { name: 'Separate pH meter', text: 'usually more stable and easier to recalibrate than combo units; store the probe moist in storage solution.' },
                { name: 'Calibration solutions', text: 'EC against 1413 \u00b5S/cm (or 640/700 PPM) and pH against 7.0 then 4.0; rinse between buffers.' },
                { name: 'Calibration rhythm', text: 'recalibrate monthly, or anytime a reading looks off or a probe has been dry.' }
            ],
            samplingTitle: 'Taking a good sample',
            sampling: [
                { name: 'Mid-reservoir sample', text: 'take from the moving solution, not a calm corner; in NFT sample at the drain end.' },
                { name: 'Probe hygiene', text: 'rinse with clean water between samples and never wipe the pH tip dry.' },
                { name: 'Measure EC before pH', text: 'both probes stir the sample; EC first keeps the strongest-affected reading clean.' },
                { name: 'Temperature matters', text: 'EC and pH both drift with temperature \u2014 let the sample sit near solution temperature before trusting a pH reading.' }
            ],
            pitfallsTitle: 'Common reading pitfalls',
            pitfalls: [
                'Air bubbles against an EC electrode cause jumpy readings \u2014 tap the probe or stir gently.',
                'Cold solution slows the pH electrode; a reading taken right after top-up can under-shoot.',
                'Hard source water raises the baseline EC \u2014 subtract your water\u2019s EC before comparing with a crop target.',
                'A failing probe shows a suspiciously perfect 7.0 or slow drifting values; fresh buffers confirm the culprit.'
            ]
        },
        calibration: {
            title: 'Calibration',
            subtitle: 'Track when your meters were last calibrated and follow a quick routine to keep readings trustworthy.',
            statusTitle: 'Meter status',
            ecMeter: 'EC meter',
            phMeter: 'pH meter',
            never: 'Never calibrated',
            calibratedToday: 'Calibrated today',
            daysAgo: '{days} days ago',
            calibrateBtn: 'Calibrate',
            status: {
                ok: 'OK',
                due: 'Due',
                none: '—'
            },
            wizardTitle: 'Calibrate {meter}',
            wizardHint: 'Tick each step as you complete it, then log the calibration for today.',
            logBtn: 'Log calibration for today',
            ecSteps: [
                'Rinse the probe with clean water.',
                'Place in EC calibration solution (1413 µS/cm, or your meter\u2019s 640/700 PPM standard).',
                'Wait for the reading to stabilise.',
                'Confirm the value matches the solution, then rinse the probe.'
            ],
            phSteps: [
                'Rinse the probe with clean water.',
                'Place in pH 7.0 buffer and calibrate.',
                'Rinse, then place in pH 4.0 buffer and calibrate a second point.',
                'Rinse and store the probe with a drop of storage solution.'
            ],
            careTitle: 'Equipment care',
            care: [
                { name: 'Probe storage', text: 'keep pH probes moist in storage solution and EC probes in storage solution or a damp tip cap; never let them dry out.' },
                { name: 'Cleaning', text: 'dissolve stubborn film on EC probes with sensor cleaner, then rinse; remove pH electrode buildup with gentle cleaner and a rinse.' },
                { name: 'Dry probe recovery', text: 'soak a dried electrode in storage solution for several hours before recalibrating.' }
            ]
        },
        guide: {
            title: 'Guide',
            intro: 'A short grounding in the six numbers that matter most, then how to begin.',
            systemsTitle: 'Hydroponic systems',
            systems: [
                { name: 'Nutrient Film Technique (NFT)', text: 'A thin film of solution flows over bare roots in tilted channels. Excellent for fast leafy greens and herbs; needs steady, well-oxygenated water.' },
                { name: 'Deep Water Culture (DWC)', text: 'Roots hang in a tall, aerated reservoir with floating rafts. The simplest reliable system for beginners; great for lettuce and leafy greens.' },
                { name: 'Ebb & flow', text: 'A tray floods with nutrient solution on a timer and drains back to the reservoir. Versatile across crop types and forgiving to manage.' },
                { name: 'Drip / Dutch bucket', text: 'Drippers feed a substrate (rockwool, perlite, coco) in pots or buckets, with runoff recirculated. The standard for heavy fruiting vines like tomato, cucumber and pepper.' }
            ],
            waterTitle: 'Water quality first',
            water: [
                'Measure source water EC/PPM before dosing \u2014 tap water already carries dissolved salts.',
                'Keep solution temperature 16\u201324 \u00b0C (cooler for berries and brassicas). Warm water holds less oxygen.',
                'Maintain dissolved oxygen above \u22484 ppm; aerate DWC/NFT reservoirs continuously.',
                'Start from clean water (RO or filtered) if your tap is hard or variable.'
            ],
            nutrientTitle: 'Nutrients: the basics',
            nutrient: [
                'EC measures the strength of the whole solution; PPM is just a scale conversion (500 / 640 / 700).',
                'N-P-K shifts by stage: leafy crops want nitrogen, fruiting crops want more phosphorus and especially potassium after fruit set.',
                'Mix calcium nitrate separately and add it last \u2014 it reacts with phosphates if concentrated.',
                'Low EC + proper pH beats high EC with locked-out nutrients. pH 5.5\u20136.5 covers nearly all vegetables.'
            ],
            firstTitle: 'First steps',
            first: [
                'Start with lettuce or radish \u2014 fast, forgiving, and the best-documented crops.',
                'Build to one crop, log EC/pH daily, then expand once the reservoir is stable for a week.',
                'Harvest on time: leafy greens bolt and roots go pithy when left past their window.',
                'Keep a simple log sheet \u2014 the data you collect is the best research you will find for your own setup.'
            ]
        },
        references: {
            title: 'References',
            intro: 'Every value in this app traces back to published research or specialty reference charts. Below is the full source list.',
            tableHeaders: {
                publisher: 'Publisher',
                title: 'Title',
                year: 'Year',
                type: 'Type'
            },
            types: {
                handbook: 'Handbook',
                university: 'University research',
                industry: 'Industry / extension alert',
                book: 'Book',
                community: 'Community reference chart'
            },
            disclaimer: 'Community-compiled charts are a practical synthesis of the academic sources above; use them as a quick lookup, not a recipe.'
        }
    },
    nl: {
        appTitle: 'Hydro Research',
        appSubtitle: 'Hydroponische kweekdata & calculators voor thuis-kwekers',
        tabs: {
            crops: 'Gewassen',
            journal: 'Dagboek',
            calculators: 'Calculators',
            testing: 'Testen',
            calibration: 'Kalibratie',
            guide: 'Gids',
            references: 'Referenties'
        },
        lang: {
            label: 'Taal',
            en: 'English',
            nl: 'Nederlands'
        },
        disclaimer: 'Waarden zijn startpunten op basis van onderzoek. Pas ze aan aan jouw water, ras, systeem en klimaat.',
        crops: {
            searchPlaceholder: 'Zoek gewassen…',
            categoryFilter: 'Categorie',
            categories: {
                all: 'Alle',
                leafy: 'Bladgroenten',
                herbs: 'Kruiden',
                fruiting: 'Fruitdragend',
                berries: 'Bessen',
                root: 'Wortel'
            },
            countSingular: 'gewas',
            countPlural: 'gewassen',
            noResults: 'Geen gewassen gevonden voor je zoekopdracht.'
        },
        crop: {
            stages: {
                seedling: 'Kiemplant',
                vegetative: 'Vegetatief',
                fruiting: 'Fruitdragend',
                mature: 'Volgroeid'
            },
            stageLabel: 'Groeifase',
            ec: 'EC (mS/cm)',
            ph: 'pH-bereik',
            ppm500: 'PPM (schaal 500)',
            ppm700: 'PPM (schaal 700)',
            climate: 'Klimaat',
            airTemp: 'Luchttemperatuur',
            waterTemp: 'Watertemperatuur',
            humidity: 'Relatieve luchtvochtigheid',
            dli: 'Daily Light Integral (DLI)',
            photoperiod: 'Fotoperiode',
            units: {
                celsius: '\u00b0C',
                humidity: '% RV',
                dli: 'mol/m\u00b2/dag',
                hours: 'u/dag',
                cm: 'cm'
            },
            growth: 'Groei',
            germination: 'Kieming',
            daysToHarvest: 'Dagen tot oogst',
            note: 'Opmerking',
            spacing: 'Plantafstand',
            systemsTitle: 'Geschikte systemen',
            systems: {
                nft: 'Nutrient Film Technique (NFT)',
                dwc: 'Deep Water Culture (DWC)',
                ebbFlow: 'Ebb & flow',
                drip: 'Drip',
                dutchBucket: 'Dutch bucket'
            },
            feedTitle: 'Voedingsrichtlijn',
            npkRatio: 'Elementaire N:P:K-verhouding',
            recipesTitle: 'Voedingslijn-opties',
            recipesLine: 'Lijn',
            troubleshooting: 'Problemen oplossen',
            troubleSymptom: 'Symptoom',
            troubleCause: 'Oorzaak',
            troubleFix: 'Oplossing',
            notesTitle: 'Kweektips',
            sourcesTitle: 'Bronnen',
            backToList: '\u2190 Terug naar lijst'
        },
        calculators: {
            title: 'Calculators',
            subtitle: 'Snel, eerlijk rekenwerk voor dagelijkse kweekbeslissingen.',
            ecTitle: 'EC \u2194 PPM-omzetter',
            ecDesc: 'Zet elektrische geleidbaarheid om naar PPM op de drie gangbare meterschalen.',
            ecInput: 'EC (mS/cm)',
            ppm500: 'PPM (schaal 500 \u2014 Hanna, Bluelab)',
            ppm700: 'PPM (schaal 700 \u2014 Truncheon, HM Digital)',
            ppm640: 'PPM (schaal 640 \u2014 Eutech)',
            ecNote: 'Tip: trek de EC/PPM van je bronwater af voordat je vergelijkt met een gewasdoel.',
            doseTitle: 'Voedingscalculator',
            doseDesc: 'Kies een gewas, fase en voedingslijn en je krijgt hoeveelheden per liter en per reservoir.',
            doseCrop: 'Gewas',
            doseStage: 'Fase',
            doseLine: 'Voedingslijn',
            doseVolume: 'Reservoirvolume (L)',
            doseSourceEc: 'EC van bronwater (meestal 0,0\u20130,4)',
            doseTargetEc: 'Doel-EC (uit de gewaskaart)',
            doseBtn: 'Bereken',
            doseResultTitle: 'Hoeveelheden mengen in {volume} L',
            doseAddToReach: 'Toevoegen om \u2248{ec} mS/cm boven je water te komen',
            dosepH: 'Breng daarna de pH naar het fase-bereik van het gewas met pH-plus/min.',
            doseSource: 'Lijn-presets bevatten bekende thuisverhoudingen; controleer altijd het etiket van jouw producten.',
            dliTitle: 'DLI / lichtcalculator',
            dliDesc: 'Daily Light Integral (DLI) uit PPFD en fotoperiode.',
            dliCrop: 'Gewas (DLI-doel)',
            dliPpfd: 'PPFD (\u00b5mol/m\u00b2/s)',
            dliHours: 'Fotoperiode (u/dag)',
            dliResult: 'DLI',
            dliTargetHint: 'Gekozen gewasdoel: {range} mol/m\u00b2/dag ({name})',
            dliBelow: 'Onder het doel \u2014 verhoog PPFD of uren.',
            dliWithin: 'Binnen het doelbereik.',
            dliAbove: 'Boven het doel \u2014 let op warmte-/lichtstress; verlaag PPFD of uren.',
            planTitle: 'Gewas- & oogstplanner',
            planDesc: 'Kies een gewas en startdatum en zie de verwachte tijdsvensters.',
            planCrop: 'Gewas',
            planStart: 'Startdatum',
            planPerWeek: 'Oogsten per week',
            planWeeks: 'Plan vooruit (weken)',
            planGermination: 'Kieming',
            planHarvest: 'Oogstvenster',
            planInfo: 'Datums zijn bereiken op basis van gepubliceerde gemiddelden; de werkelijke timing hangt af van je systeem en seizoen.'
        },
        journal: {
            title: 'Groeidagboek',
            intro: 'Log wat je daadwerkelijk meet en zie in \u00e9\u00e9n oogopslag of elke meting binnen het fase-doel van je gewas valt.',
            overviewTitle: 'Jouw groeien',
            newGrow: 'Nieuwe groei',
            emptyTitle: 'Nog geen groeien',
            emptyHint: 'Maak een groei aan en begin EC, pH en temperatuur te loggen tegen de fase-doelen van het gewas.',
            storageNote: 'Alleen lokaal opgeslagen in je browser. Exporteer CSV voor een kopie; browserdata wissen wist het dagboek.',
            growCountSingular: 'groei',
            growCountPlural: 'groeien',
            noReadings: 'Nog geen metingen \u2014 gebruik het formulier hierboven.',
            form: {
                crop: 'Gewas',
                name: 'Naam (optioneel)',
                start: 'Startdatum',
                system: 'Systeem',
                notes: 'Notities (optioneel)',
                create: 'Groei aanmaken'
            },
            detail: {
                back: '\u2190 Alle groeien',
                reading: 'Meting',
                deleteGrow: 'Verwijder groei',
                deleteReading: 'Verwijder',
                confirm: 'Bevestigen?',
                cancel: 'Annuleren',
                csv: 'Exporteer CSV',
                day: 'Dag',
                started: 'Gestart',
                readingsCountSingular: 'meting',
                readingsCountPlural: 'metingen'
            },
            formReading: {
                date: 'Datum',
                stage: 'Groeifase',
                ec: 'EC (mS/cm)',
                ph: 'pH',
                waterTemp: 'Watertemp (\u00b0C)',
                airTemp: 'Luchttemp (\u00b0C)',
                notes: 'Notities (optioneel)',
                submit: 'Log meting',
                target: 'Doel voor {stage}:'
            },
            readingsTitle: 'Metingen',
            table: {
                date: 'Datum',
                stage: 'Fase',
                ec: 'EC',
                ph: 'pH',
                waterTemp: 'Water',
                airTemp: 'Lucht',
                notes: 'Notities'
            },
            status: {
                ok: 'Binnen bereik',
                low: 'Te laag',
                high: 'Te hoog',
                none: '\u2014'
            },
            summaryInRange: '{field} binnen bereik {in}/{total}',
            trendTitle: 'Trend',
            trendTooFew: 'Log minimaal twee gemeten lezingen om een trend te zien.',
            fieldLabels: {
                ec: 'EC',
                ph: 'pH'
            }
        },
        testing: {
            title: 'Testen',
            subtitle: 'Een snelle controle van \u00e9\u00e9n meting tegen de fase- en klimaatdoelen van het gewas, plus notities over meters en bemonstering.',
            crop: 'Gewas',
            stage: 'Fase',
            ec: 'EC (mS/cm)',
            ph: 'pH',
            waterTemp: 'Watertemp (\u00b0C)',
            airTemp: 'Luchttemp (\u00b0C)',
            selectHint: 'Kies een gewas en fase en meet vervolgens. Elke testregel toont jouw waarde tegen het doel met een live status.',
            summary: '{in} van {total} velden binnen bereik',
            metersTitle: 'Meters & kalibratie',
            meters: [
                { name: 'EC/PPM-combimeter', text: 'dekt de meeste behoeften met \u00e9\u00e9n sonde; PPM is slechts een schaalomzetting, dus houd je meter en je controles op dezelfde schaal.' },
                { name: 'Aparte pH-meter', text: 'meestal stabieler en makkelijker te kalibreren dan combi-units; bewaar de sonde vochtig in opslagvloeistof.' },
                { name: 'Kalibratievloeistoffen', text: 'EC tegen 1413 \u00b5S/cm (of 640/700 PPM) en pH tegen 7,0 en daarna 4,0; spoel tussen de buffers.' },
                { name: 'Kalibratieritme', text: 'kalibreer maandelijks, of zodra een meting er raar uitziet of een sonde droog is geweest.' }
            ],
            samplingTitle: 'Een goede monster nemen',
            sampling: [
                { name: 'Monster uit de beweging', text: 'neem uit de bewegende oplossing, niet uit een rustig hoekje; bij NFT bemonster aan het afvoeruiteinde.' },
                { name: 'Spondehygi\u00ebne', text: 'spoel met schoon water tussen monsters en wrijf de pH-punt nooit droog.' },
                { name: 'Meet EC v\u00f3\u00f3r pH', text: 'beide sondes roeren de vloeistof; EC eerst houdt de sterkst be\u00efnvloede meting schoon.' },
                { name: 'Temperatuur telt', text: 'EC en pH drijven allebei met temperatuur \u2014 laat het monster op oplossingstemperatuur komen voordat je een pH-meting vertrouwt.' }
            ],
            pitfallsTitle: 'Veelvoorkomende meetfouten',
            pitfalls: [
                'Luchtbellen tegen een EC-elektrode geven schokkerige metingen \u2014 tik de sonde of roer zachtjes.',
                'Koude vloeistof vertraagt de pH-elektrode; een meting vlak na bijvullen kan te laag uitvallen.',
                'Hard bronwater verhoogt de basis-EC \u2014 trek de EC van je water af v\u00f3\u00f3r je vergelijkt met een gewasdoel.',
                'Een slechte sonde toont een verdacht perfect 7,0 of langzaam ronddrijvende waarden; verse buffervloeistoffen bevestigen de boosdoener.'
            ]
        },
        calibration: {
            title: 'Kalibratie',
            subtitle: 'Houd bij wanneer je meters voor het laatst gekalibreerd zijn en volg een snelle routine om metingen betrouwbaar te houden.',
            statusTitle: 'Meterstatus',
            ecMeter: 'EC-meter',
            phMeter: 'pH-meter',
            never: 'Nog nooit gekalibreerd',
            calibratedToday: 'Vandaag gekalibreerd',
            daysAgo: '{days} dagen geleden',
            calibrateBtn: 'Kalibreren',
            status: {
                ok: 'OK',
                due: 'Vervallen',
                none: '—'
            },
            wizardTitle: '{meter} kalibreren',
            wizardHint: 'Vink elke stap aan zodra je hem hebt uitgevoerd en log daarna de kalibratie voor vandaag.',
            logBtn: 'Log kalibratie voor vandaag',
            ecSteps: [
                'Spoel de sonde met schoon water.',
                'Plaats in EC-kalibratievloeistof (1413 \u00b5S/cm, of jouw 640/700 PPM-standaard).',
                'Wacht tot de meting stabiel is.',
                'Bevestig dat de waarde klopt met de vloeistof en spoel de sonde daarna.'
            ],
            phSteps: [
                'Spoel de sonde met schoon water.',
                'Plaats in pH 7,0-buffer en kalibreer.',
                'Spoel, plaats in pH 4,0-buffer en kalibreer een tweede punt.',
                'Spoel en bewaar de sonde met een druppel opslagvloeistof.'
            ],
            careTitle: 'Onderhoud apparatuur',
            care: [
                { name: 'Sondeopslag', text: 'houd pH-sondes vochtig in opslagvloeistof en EC-sondes in opslagvloeistof of een vochtige beschermkap; laat ze nooit uitdrogen.' },
                { name: 'Reinigen', text: 'los hardnekkige aanslag op EC-sondes op met sensorreiniger en spoel daarna; verwijder aanslag op pH-elektroden met milde reiniger en een spoeling.' },
                { name: 'Herstel droge sonde', text: 'week een uitgedroogde elektrode enkele uren in opslagvloeistof v\u00f3\u00f3r je opnieuw kalibreert.' }
            ]
        },
        guide: {
            title: 'Gids',
            intro: 'Korte basis over de zes getallen die er echt toe doen, en hoe je begint.',
            systemsTitle: 'Hydro-systeemtypen',
            systems: [
                { name: 'Nutrient Film Technique (NFT)', text: 'Een dunne film voedingsoplossing stroomt over de blote wortels in hellende goten. Uitstekend voor snelle bladgroenten en kruiden; heeft stabiel, goed zuurstofrijk water nodig.' },
                { name: 'Deep Water Culture (DWC)', text: 'Wortels hangen in een hoog, belucht reservoir met drijvende vlotten. Het eenvoudigste betrouwbare systeem voor beginners; geweldig voor sla en bladgroenten.' },
                { name: 'Ebb & flow', text: 'Een bak wordt met een timer volgezet met voedingsoplossing en loopt terug naar het reservoir. Veelzijdig over gewastypen en vergevingsgezind in beheer.' },
                { name: 'Drip / Dutch bucket', text: 'Druppelaars bevochtigen substraat (rockwool, perliet, coco) in potten of emmers, met recirculatie van de afvoer. De standaard voor zware vruchtplanten als tomaat, komkommer en paprika.' }
            ],
            waterTitle: 'Waterkwaliteit eerst',
            water: [
                'Meet de EC/PPM van je bronwater vóór het doseren \u2014 leidingwater bevat al opgeloste zouten.',
                'Houd de oplossing op 16\u201324 \u00b0C (koeler voor bessen en koolachtigen). Warm water bevat minder zuurstof.',
                'Houd opgeloste zuurstof boven \u22484 ppm; belucht DWC/NFT-reservoirs continu.',
                'Begin met schoon water (RO of gefilterd) als je leidingwater hard of wisselend is.'
            ],
            nutrientTitle: 'Nutriënten: de basis',
            nutrient: [
                'EC meet de sterkte van de hele oplossing; PPM is slechts een schaalomzetting (500 / 640 / 700).',
                'N-P-K verschuift per fase: bladgewassen willen stikstof, fruitdragende gewassen meer fosfor en vooral kalium na de vruchtzetting.',
                'Meng calciumnitraat apart en voeg het als laatste toe \u2014 het reageert met fosfaten als het geconcentreerd is.',
                'Een lage EC met de juiste pH verslaat een hoge EC met geblokkeerde opname. pH 5,5\u20136,5 dekt bijna alle groenten.'
            ],
            firstTitle: 'Eerste stappen',
            first: [
                'Begin met sla of radijs \u2014 snel, vergevingsgezind en het best gedocumenteerd.',
                'Bouw op met één gewas, noteer dagelijks EC/pH en breid pas uit als het reservoir een week stabiel staat.',
                'Oogst op tijd: bladgroenten schieten door en wortels worden sponzig als ze te lang staan.',
                'Houd een simpel logboek bij \u2014 jouw eigen data is het beste onderzoek voor jouw opstelling.'
            ]
        },
        references: {
            title: 'Referenties',
            intro: 'Elke waarde in deze app komt uit gepubliceerd onderzoek of gespecialiseerde referentie-charts. Hieronder de volledige bronlijst.',
            tableHeaders: {
                publisher: 'Uitgever',
                title: 'Titel',
                year: 'Jaar',
                type: 'Type'
            },
            types: {
                handbook: 'Handboek',
                university: 'Universitair onderzoek',
                industry: 'Industrie / extension-alert',
                book: 'Boek',
                community: 'Community-referentiechart'
            },
            disclaimer: 'Community-charts zijn een praktische synthese van de academische bronnen hierboven; gebruik ze als snelle naslag, niet als recept.'
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI_STRINGS;
}