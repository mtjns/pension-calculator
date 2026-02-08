// calculate.js

// Konstanty
const ZAKLADNI_VYMERA = 4440;
const REDUKCNI_HRANICE_1 = 19346;
const KOEF_REDUKNCI_HRANICE_1 = 0.26;
const REDUKCNI_HRANICE_2 = 175868;
const MAXPREDCASNY = 3; // Maximální počet let, o které lze odejít dříve do důchodu
const KOEFICIENT_NAHRADNI_DOBA = 0.8; // Každý rok náhradní doby se počítá jako část odpracovaného roku

const today = new Date();

// Validace inputu
function validateInput(vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi) {
    if (vymerovaciZaklad < 0 || odpracovaneRoky < 0 || pocetDeti < 0 || nahradniRoky < 0) {
        return new Error('Všechny číselné hodnoty musí být nezáporné.')
    }
    else if (odpracovaneRoky - 1 > today.getFullYear() - rocnik) {
        return new Error('Počet odpracovaných let nemůže být větší než váš aktuální věk.')
    }
    else if (!rocnik || rocnik < 1920 || rocnik > today.getFullYear() - 15) {
        return new Error('Neplatný ročník narození. Zadejte číslo mezi 1920 a ' + (today.getFullYear() - 15) + ".")
    }
    else if (pohlavi !== 'M' && pohlavi !== 'F') {
        return new Error('Neplatné pohlaví. Zadejte Z "M" pro muže nebo "F" pro ženy.')
    }
}

// Kalkuluje věk odchodu do důchodu
function getDuchodovyVek(rocnik, pohlavi, pocetDeti) {
    if (rocnik >= 1971) return 65.0; // Nejvyšší věk pro nejmladší generace

    if (pohlavi === 'M') {
        if (rocnik <= 1953) return 60.0;
        const posun = (rocnik - 1953) * 2;
        return Math.min(60 + (posun / 12), 65.0);
    } else {
        let zaklad = 57;
        if (pocetDeti === 1) zaklad = 56;
        if (pocetDeti === 2) zaklad = 55;
        if (pocetDeti === 3) zaklad = 54;
        if (pocetDeti >= 4) zaklad = 53;

        if (rocnik <= 1953) return zaklad;
        const posun = (rocnik - 1953) * 4;
        return Math.min(zaklad + (posun / 12), 65.0);
    }
}

// Výpočet redukovaného základu
function getRedukovanyZaklad(vymerovacizaklad) {
    if (vymerovacizaklad > REDUKCNI_HRANICE_1) {
        if (vymerovacizaklad > REDUKCNI_HRANICE_2) {
            // Pokud je základ vyšší než druhá redukční hranice
            return REDUKCNI_HRANICE_1 + (REDUKCNI_HRANICE_2 - REDUKCNI_HRANICE_1) * KOEF_REDUKNCI_HRANICE_1;
        } else {
            // Pokud je základ mezi první a druhou redukční hranicí
            return REDUKCNI_HRANICE_1 + (vymerovacizaklad - REDUKCNI_HRANICE_1) * KOEF_REDUKNCI_HRANICE_1;
        }
    } else {
        return vymerovacizaklad;
    }
}

// Hlavní výpočet důchodu
function spocitejDuchod(vymerovacizaklad, odpracovaneRoky, kraceneRoky = 0, bonusKoef = 0, pocetDeti = 0) {
    // Klasický výpočet důchodu: základní výměra + procentní výměra
    let redukovanyZaklad = getRedukovanyZaklad(vymerovacizaklad);
    let procentniVymera = redukovanyZaklad * (odpracovaneRoky * 0.015);

    // Bonus za děti (vychovné)
    let bonusVychovne = pocetDeti * 500;

    // Krácení za předčasný odchod a bonus za odložení důchodu
    if (kraceneRoky > 0) procentniVymera *= (1 - kraceneRoky);
    if (bonusKoef > 0) procentniVymera *= (1 + bonusKoef);

    celkovyDuchod = ZAKLADNI_VYMERA + procentniVymera + bonusVychovne;
    return Math.floor(celkovyDuchod);
}

// Generování scénářů pro různé možnosti odchodu do důchodu
function getScenare(vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi) {
    scenarios = [];

    const duchodovyVek = getDuchodovyVek(rocnik, pohlavi, pocetDeti);
    const aktualniVek = today.getFullYear() - rocnik;
    const rokyDoDuchodu = duchodovyVek - aktualniVek;
    const efektivniDoba = odpracovaneRoky + nahradniRoky * KOEFICIENT_NAHRADNI_DOBA;

    // A) UŽ MÁ NÁROK
    if (rokyDoDuchodu <= 0) {
        const resultNow = spocitejDuchod(vymerovaciZaklad, efektivniDoba, 0, 0, pocetDeti);
        const resultSoubeh = resultNow;
        const resultDeferred = spocitejDuchod(vymerovaciZaklad, efektivniDoba + 1, 0, 0.06, pocetDeti);

        scenarios = [
            {
                id: "now_pension",
                title: "Řádný odchod do důchodu (Teď)",
                amount: resultNow,
                desc: "Okamžitý odchod. Máte splněn věk i dobu pojištění.",
                type: "neutral" // Standardní volba
            },
            {
                id: "now_work_pension",
                title: "Práce + Důchod (Souběh)",
                amount: resultSoubeh,
                desc: "Pobíráte důchod i mzdu současně.",
                type: "best"
            },
            {
                id: "now_defer",
                title: "Práce rok navíc (bez důchodu)",
                amount: resultDeferred,
                desc: "Pokud rok **nebudete** pobírat důchod a budete pracovat, získáte **bonus cca 6 %** natrvalo.",
                type: "neutral"
            }
        ];
    }

    // B) JEŠTĚ NEMÁ VĚK NA NÁROK NA DŮCHOD
    else {
        // 1. Řádný
        const celkovaDoba = efektivniDoba + rokyDoDuchodu; // Doba kterou se bude počítat řádný důchod (včetně náhradní doby)
        const resultRegular = spocitejDuchod(vymerovaciZaklad, celkovaDoba, 0);

        scenarios.push({
            id: "future_pension",
            title: `Řádný důchod`,
            amount: resultRegular,
            desc: `Váš cílový důchod v roce ${Math.floor(today.getFullYear() + rokyDoDuchodu)}.`,
            type: "best"
        });

        // 2. Předčasný
        if (rokyDoDuchodu <= MAXPREDCASNY) { // Předčasný důchod je možný pouze do určitého limitu
            const sankce = (rokyDoDuchodu * 6) / 100;
            const resultEarly = spocitejDuchod(vymerovaciZaklad, efektivniDoba, sankce);

            scenarios.push({
                id: "early_pension",
                title: "Předčasný důchod (Teď)",
                amount: resultEarly,
                desc: `Odchod o **${rokyDoDuchodu.toFixed(1)} let dříve**. Důchod bude **trvale nižší** o sankci.`,
                type: "warn"
            });
        } else {
            const vekNaroku = duchodovyVek - MAXPREDCASNY;
            const rokNaroku = Math.floor(new Date().getFullYear() + rokyDoDuchodu - MAXPREDCASNY);

            scenarios.push({
                id: "early_impossible",
                title: "Předčasný důchod",
                amount: 0,
                desc: `Zatím nemáte nárok na předčasný důchod. Možné nejdříve v **${vekNaroku.toFixed(1)} letech** (v roce ${rokNaroku}).`,
                type: "neutral"
            });
        }

        // 3. Přesluhování (pouze < 5 let do důchodu)
        if (rokyDoDuchodu <= 5) {
            const resultMax = spocitejDuchod(vymerovaciZaklad, celkovaDoba + 1, 0, 0.06);
            scenarios.push({
                id: "future_defer",
                title: "Práce rok navíc (Přesluhování)",
                amount: resultMax,
                desc: "Pokud v budoucnu odložíte důchod o 1 rok, získáte **bonus cca 6 %**.",
                type: "neutral"
            });
        }
    }
    return scenarios;
}

// Parsování inputu z query parametrů
function parseInput(request) {
    try {
        const { salary, years, birthYear, gender, children, substituteYears } = request.query;
    }
    catch (error) {
        console.error("Chyba při parsování query parametrů:", error);
        throw new Error("Neplatné parametry. Ujistěte se, že všechny vstupy jsou správně zadány.");
    }
    // 1. Parsování inputu
    const vymerovaciZaklad = parseFloat(salary) || 0;
    const odpracovaneRoky = parseFloat(years) || 0;
    const rocnik = parseFloat(birthYear);
    const pocetDeti = parseFloat(children) || 0;
    const nahradniRoky = parseFloat(substituteYears) || 0;
    const pohlavi = gender || 'M';
    return { vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi };
}


// API Handler
export default function handler(request, response) {
    // Povolení CORS pro vývoj - localhost
    if (process.env.NODE_ENV === 'development') {
        response.setHeader('Access-Control-Allow-Credentials', true);
        response.setHeader('Access-Control-Allow-Origin', '*');
    }

    try {
        // Parsování inputu
        const { vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi } = parseInput(request);

        // Validace inputu
        validateInput(vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi)
    } catch (error) {
        console.error("Chyba při zpracování požadavku:", error);
        response.status(400).json({ error: "Neplatné parametry. Ujistěte se, že všechny vstupy jsou správně zadány." });
        return;
    }

    // Generování odpovědi
    let scenarios = getScenare(vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi);

    // Odeslání odpovědi
    response.status(200).json({ scenarios });
}