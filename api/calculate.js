const today = new Date();
const ZAKLADNI_VYMERA = 4440;
const REDUKCNI_HRANICE_1 = 19346;
const KOEF_REDUKNCI_HRANICE_1 = 0.26;
const REDUKCNI_HRANICE_2 = 175868;
const MAXPREDCASNY = 3;
const KOEFICIENT_NAHRADNI_DOBA = 0.8;
const MIN_PROCENTNI_VYMERA = 770;

class Person {
    constructor({ vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi }) {
        this.vymerovaciZaklad = vymerovaciZaklad;
        this.odpracovaneRoky = odpracovaneRoky;
        this.rocnik = rocnik;
        this.pocetDeti = pocetDeti;
        this.nahradniRoky = nahradniRoky;
        this.pohlavi = pohlavi;
    }

    get aktualniVek() {
        return today.getFullYear() - this.rocnik;
    }

    get efektivniDoba() {
        return this.odpracovaneRoky + (this.nahradniRoky * KOEFICIENT_NAHRADNI_DOBA);
    }

    get duchodovyVek() {
        if (this.rocnik >= 1971) return 65.0;

        if (this.pohlavi === 'M') {
            if (this.rocnik <= 1953) return 60.0;
            const posun = (this.rocnik - 1953) * 2;
            return Math.min(60 + (posun / 12), 65.0);
        } else {
            let zaklad = 57;
            if (this.pocetDeti === 1) zaklad = 56;
            if (this.pocetDeti === 2) zaklad = 55;
            if (this.pocetDeti === 3) zaklad = 54;
            if (this.pocetDeti >= 4) zaklad = 53;

            if (this.rocnik <= 1953) return zaklad;
            const posun = (this.rocnik - 1953) * 4;
            return Math.min(zaklad + (posun / 12), 65.0);
        }
    }

    get rokyDoDuchodu() {
        return this.duchodovyVek - this.aktualniVek;
    }

    get redukovanyZaklad() {
        if (this.vymerovaciZaklad > REDUKCNI_HRANICE_1) {
            if (this.vymerovaciZaklad > REDUKCNI_HRANICE_2) {
                return REDUKCNI_HRANICE_1 + (REDUKCNI_HRANICE_2 - REDUKCNI_HRANICE_1) * KOEF_REDUKNCI_HRANICE_1;
            } else {
                return REDUKCNI_HRANICE_1 + (this.vymerovaciZaklad - REDUKCNI_HRANICE_1) * KOEF_REDUKNCI_HRANICE_1;
            }
        } else {
            return this.vymerovaciZaklad;
        }
    }

    spocitejDuchod(celkovaDoba, koeficientKraceni = 0, koeficientBonus = 0) {
        let procentniCast = this.redukovanyZaklad * (celkovaDoba * 0.015);
        procentniCast = Math.max(MIN_PROCENTNI_VYMERA, procentniCast);

        const bonusZaDeti = this.pocetDeti * 500;

        if (koeficientKraceni > 0) procentniCast *= (1 - koeficientKraceni);
        if (koeficientBonus > 0) procentniCast *= (1 + koeficientBonus);

        const celkovyDuchod = ZAKLADNI_VYMERA + procentniCast + bonusZaDeti;
        return Math.floor(celkovyDuchod);
    }
}

class Scenario {
    constructor(id, title, amount, desc, type) {
        this.id = id;
        this.title = title;
        this.amount = amount;
        this.desc = desc;
        this.type = type;
    }
}

function generateScenarios(person) {
    let scenarios = [];
    const rokyDoDuchodu = person.rokyDoDuchodu;

    // A) UŽ MÁ NÁROK (nebo přesluhuje)
    if (rokyDoDuchodu <= 0) {
        const resultNow = person.spocitejDuchod(person.efektivniDoba, 0, 0);
        const resultConcurrent = resultNow;
        const resultDeferred = person.spocitejDuchod(person.efektivniDoba + 1, 0, 0.06);

        scenarios = [
            new Scenario(
                "now_pension",
                "Řádný odchod do důchodu (Teď)",
                resultNow,
                "Okamžitý odchod. Máte splněn věk i dobu pojištění.",
                "neutral"
            ),
            new Scenario(
                "now_work_pension",
                "Práce + Důchod (Souběh)",
                resultConcurrent,
                "Pobíráte důchod i mzdu současně.",
                "best"
            ),
            new Scenario(
                "now_defer",
                "Práce rok navíc (bez důchodu)",
                resultDeferred,
                "Pokud rok **nebudete** pobírat důchod a budete pracovat, získáte **bonus cca 6 %** natrvalo.",
                "neutral"
            )
        ];
    }
    // B) JEŠTĚ NEMÁ VĚK NA NÁROK NA DŮCHOD
    else {
        // 1. Řádný
        const celkovaDoba = person.efektivniDoba + rokyDoDuchodu;
        const resultRegular = person.spocitejDuchod(celkovaDoba, 0, 0);

        scenarios.push(new Scenario(
            "future_pension",
            "Řádný důchod",
            resultRegular,
            `Váš cílový důchod v roce ${Math.floor(today.getFullYear() + rokyDoDuchodu)}.`,
            "best"
        ));

        // 2. Předčasný
        if (rokyDoDuchodu <= MAXPREDCASNY) {
            const reduction = (rokyDoDuchodu * 6) / 100;
            const resultEarly = person.spocitejDuchod(person.efektivniDoba, reduction, 0);

            scenarios.push(new Scenario(
                "early_pension",
                "Předčasný důchod (Teď)",
                resultEarly,
                `Odchod o **${rokyDoDuchodu.toFixed(1)} let dříve**. Důchod bude **trvale nižší** o sankci.`,
                "warn"
            ));
        } else {
            const ageEligible = person.duchodovyVek - MAXPREDCASNY;
            const yearEligible = Math.floor(today.getFullYear() + rokyDoDuchodu - MAXPREDCASNY);

            scenarios.push(new Scenario(
                "early_impossible",
                "Předčasný důchod",
                0,
                `Zatím nemáte nárok na předčasný důchod. Možné nejdříve v **${ageEligible.toFixed(1)} letech** (v roce ${yearEligible}).`,
                "neutral"
            ));
        }

        // 3. Přesluhování (pouze < 5 let do důchodu)
        if (rokyDoDuchodu <= 5) {
            const resultMax = person.spocitejDuchod(celkovaDoba + 1, 0, 0.06);
            scenarios.push(new Scenario(
                "future_defer",
                "Práce rok navíc (Přesluhování)",
                resultMax,
                "Pokud v budoucnu odložíte důchod o 1 rok, získáte **bonus cca 6 %**.",
                "neutral"
            ));
        }
    }
    return scenarios;
}

function parseInput(request) {
    const { salary, years, birthYear, gender, children, substituteYears } = request.query || {};

    const vymerovaciZaklad = parseFloat(salary) || 0;
    const odpracovaneRoky = parseFloat(years) || 0;
    const rocnik = parseFloat(birthYear);
    const pocetDeti = parseFloat(children) || 0;
    const nahradniRoky = parseFloat(substituteYears) || 0;
    const pohlavi = gender || 'M';

    return { vymerovaciZaklad, odpracovaneRoky, rocnik, pocetDeti, nahradniRoky, pohlavi };
}

function validateInput(data) {
    if (data.vymerovaciZaklad < 0 || data.odpracovaneRoky < 0 || data.pocetDeti < 0 || data.nahradniRoky < 0) {
        return new Error('Všechny číselné hodnoty musí být nezáporné.');
    }
    else if (data.odpracovaneRoky - 1 > today.getFullYear() - data.rocnik) {
        return new Error('Počet odpracovaných let nemůže být větší než váš aktuální věk.');
    }
    else if (!data.rocnik || data.rocnik < 1920 || data.rocnik > today.getFullYear() - 15) {
        return new Error('Neplatný ročník narození. Zadejte číslo mezi 1920 a ' + (today.getFullYear() - 15) + ".");
    }
    else if (data.pohlavi !== 'M' && data.pohlavi !== 'F') {
        return new Error('Neplatné pohlaví. Zadejte "M" pro muže nebo "F" pro ženy.');
    }
    return null;
}

export default function handler(request, response) {
    if (process.env.NODE_ENV === 'development') {
        response.setHeader('Access-Control-Allow-Credentials', true);
        response.setHeader('Access-Control-Allow-Origin', '*');
    }

    let parsedData;
    try {
        parsedData = parseInput(request);
    } catch (error) {
        console.error("Chyba při parsování:", error);
        response.status(400).json({ error: "Chyba při zpracování vstupních dat." });
        return;
    }

    const validationError = validateInput(parsedData);

    if (validationError) {
        response.status(400).json({ error: validationError.message });
        return;
    }

    try {
        const person = new Person(parsedData);
        const scenarios = generateScenarios(person);
        response.status(200).json({ scenarios });
    } catch (error) {
        console.error("Chyba výpočtu:", error);
        response.status(500).json({ error: "Interní chyba výpočtu." });
    }
}