// calculate.js

// Konstanty
const today = new Date();
const ZAKLADNI_VYMERA = 4440;
const REDUKCNI_HRANICE_1 = 19346;
const REDUKCNI_HRANICE_2 = 175868;
const MAXPREDCASNY = 3;
const KOEFICIENT_NAHRADNI_DOBA = 0.8; // Každý rok náhradní doby se počítá jako část odpracovaného roku



function validateInput(hrubaMzda, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi) {
    if (hrubaMzda < 0 || odpracovaneRoky < 0 || pocetDeti < 0 || nahradniRoky < 0) {
        return 'Všechny číselné hodnoty musí být nezáporné.'
    }
    else if (odpracovaneRoky - 1 > today.getFullYear() - rocnik) {
        return 'Počet odpracovaných let nemůže být větší než váš aktuální věk.'
    }
    else if (!rocnik || rocnik < 1920 || rocnik > today.getFullYear() - 15) {
        return 'Neplatný ročník narození. Zadejte číslo mezi 1920 a ' + (today.getFullYear() - 15) + "."
    }
    else if (pohlavi !== 'M' && pohlavi !== 'Z') {
        return 'Neplatné pohlaví. Zadejte "M" pro muže nebo "Z" pro ženy.'
    }
    return null; // No errors

}

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

function spocitejDuchod(mzda, roky, kraceni = 0, bonusCoef = 0, pocetDeti = 0) {
    let redukovany = mzda;
    let bonusVychovne = pocetDeti * 500;
    if (mzda > REDUKCNI_HRANICE_1) {
        if (mzda > REDUKCNI_HRANICE_2) {
            redukovany = REDUKCNI_HRANICE_1 + (REDUKCNI_HRANICE_2 - REDUKCNI_HRANICE_1) * 0.26;
        } else {
            redukovany = REDUKCNI_HRANICE_1 + (mzda - REDUKCNI_HRANICE_1) * 0.26;
        }
    }

    let procentni = redukovany * (roky * 0.015);

    if (kraceni > 0) procentni = procentni * (1 - kraceni);
    if (bonusCoef > 0) procentni = procentni * (1 + bonusCoef);

    return Math.floor(ZAKLADNI_VYMERA + procentni + bonusVychovne);
}

export default function handler(request, response) {
    // FIXME: REMOVE IN PRODUCTION - CORS PROXY ONLY FOR LOCAL DEV
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');

    const { salary, years, birthYear, gender, children, substituteYears } = request.query;

    // 1. Parsování inputu
    const hrubaMzda = parseFloat(salary) || 0;
    const odpracovaneRoky = parseFloat(years) || 0;
    const rocnik = parseFloat(birthYear);
    const pocetDeti = parseFloat(children) || 0;
    const nahradniRoky = parseFloat(substituteYears) || 0;
    const pohlavi = gender || 'M';

    const aktualniVek = today.getFullYear() - rocnik;

    // Validace inputu
    let validationError = validateInput(hrubaMzda, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi)
    if (validationError) {
        response.status(400).json({ error: validationError });
        return;
    }

    // --- 2. Logika důchodového věku ---
    const duchodovyVek = getDuchodovyVek(rocnik, pohlavi, pocetDeti);
    const rokyDoDuchodu = duchodovyVek - aktualniVek;

    // --- 3. Výpočet náhradní doby a bonusů ---
    const efektivniDoba = odpracovaneRoky + nahradniRoky * KOEFICIENT_NAHRADNI_DOBA;


    // --- 4. GENEROVÁNÍ SCÉNÁŘŮ ---
    let scenarios = [];

    // A) UŽ MÁ NÁROK (nebo přesluhuje)
    if (rokyDoDuchodu <= 0) {
        const resultNow = spocitejDuchod(hrubaMzda, efektivniDoba, 0, 0, pocetDeti);
        const resultSoubeh = resultNow;
        const resultDeferred = spocitejDuchod(hrubaMzda, efektivniDoba + 1, 0, 0.06, pocetDeti);

        scenarios = [
            {
                id: "now",
                title: "Řádný odchod do důchodu (Teď)",
                amount: resultNow,
                desc: "Okamžitý odchod. Máte splněn věk i dobu pojištění.",
                type: "neutral" // Standardní volba
            },
            {
                id: "work_pension",
                title: "Práce + Důchod (Souběh)",
                amount: resultSoubeh,
                desc: "Pobíráte důchod i mzdu současně.",
                type: "best"
            },
            {
                id: "defer",
                title: "Práce rok navíc (bez důchodu)",
                amount: resultDeferred,
                desc: "Pokud rok **nebudete** pobírat důchod a budete pracovat, získáte **bonus cca 6 %** natrvalo.",
                type: "neutral" // Žlutá
            }
        ];
    }

    // B) JEŠTĚ NEMÁ VĚK NA NÁROK NA DŮCHOD
    else {
        // 1. Řádný
        const celkovaDoba = efektivniDoba + rokyDoDuchodu; // Doba kterou se bude počítat řádný důchod (včetně náhradní doby)
        const resultRegular = spocitejDuchod(hrubaMzda, celkovaDoba, 0);

        scenarios.push({
            id: "regular",
            title: `Řádný důchod`,
            amount: resultRegular,
            desc: `Váš cílový důchod v roce ${Math.floor(today.getFullYear() + rokyDoDuchodu)}.`,
            type: "best"
        });

        // 2. Předčasný
        if (rokyDoDuchodu <= MAXPREDCASNY) { // Předčasný důchod je možný pouze do určitého limitu
            const sankce = (rokyDoDuchodu * 6) / 100;
            const resultEarly = spocitejDuchod(hrubaMzda, efektivniDoba, sankce);

            scenarios.push({
                id: "early",
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
            const resultMax = spocitejDuchod(hrubaMzda, celkovaDoba + 1, 0, 0.06);
            scenarios.push({
                id: "defer",
                title: "Práce rok navíc (Přesluhování)",
                amount: resultMax,
                desc: "Pokud v budoucnu odložíte důchod o 1 rok, získáte **bonus cca 6 %**.",
                type: "neutral"
            });
        }
    }

    response.status(200).json({ scenarios });
}