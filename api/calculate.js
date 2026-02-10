const dnes = new Date();
const ZAKLADNI_VYMERA = 4440;
const REDUKCNI_HRANICE_1 = 19346;
const KOEF_REDUKNCI_HRANICE_1 = 0.26;
const REDUKCNI_HRANICE_2 = 175868;
const MAXPREDCASNY = 3;
const KOEFICIENT_NAHRADNI_DOBA = 0.8;
const MIN_PROCENTNI_VYMERA = 770;

class Osoba {
    constructor({ vymerovaciZaklad, odpracovaneRoky, datumNarozeni, pocetDeti, nahradniRoky, pohlavi }) {
        this.vymerovaciZaklad = vymerovaciZaklad;
        this.odpracovaneRoky = odpracovaneRoky;
        this.datumNarozeni = datumNarozeni; // Date object
        this.rocnik = datumNarozeni.getFullYear();
        this.pocetDeti = pocetDeti;
        this.nahradniRoky = nahradniRoky;
        this.pohlavi = pohlavi;
    }

    get aktualniVek() {
        // Přesný věk na roky (včetně desetinných míst)
        const diffTime = Math.abs(dnes - this.datumNarozeni);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays / 365.25;
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

class Scenar {
    constructor(id, titulek, castka, popis, typ) {
        this.id = id;
        this.title = titulek;
        this.amount = castka;
        this.desc = popis;
        this.type = typ;
    }
}

function generujScenare(osoba) {
    let scenare = [];
    const rokyDoDuchodu = osoba.rokyDoDuchodu;

    // A) UŽ MÁ NÁROK (nebo přesluhuje)
    if (rokyDoDuchodu <= 0) {
        const vysledekTed = osoba.spocitejDuchod(osoba.efektivniDoba, 0, 0);
        const vysledekSoubeh = vysledekTed;
        const vysledekOdlozeny = osoba.spocitejDuchod(osoba.efektivniDoba + 1, 0, 0.06);

        scenare = [
            new Scenar(
                "now_pension",
                "Řádný odchod do důchodu (Teď)",
                vysledekTed,
                "Okamžitý odchod. Máte splněn věk i dobu pojištění.",
                "neutral"
            ),
            new Scenar(
                "now_work_pension",
                "Práce + Důchod (Souběh)",
                vysledekSoubeh,
                "Pobíráte důchod i mzdu současně.",
                "best"
            ),
            new Scenar(
                "now_defer",
                "Práce rok navíc (bez důchodu)",
                vysledekOdlozeny,
                "Pokud rok **nebudete** pobírat důchod a budete pracovat, získáte **bonus cca 6 %** natrvalo.",
                "neutral"
            )
        ];
    }
    // B) JEŠTĚ NEMÁ VĚK NA NÁROK NA DŮCHOD
    else {
        // 1. Řádný
        const celkovaDoba = osoba.efektivniDoba + rokyDoDuchodu;
        const vysledekRadny = osoba.spocitejDuchod(celkovaDoba, 0, 0);

        scenare.push(new Scenar(
            "future_pension",
            "Řádný důchod",
            vysledekRadny,
            `Váš cílový důchod v roce ${Math.floor(dnes.getFullYear() + rokyDoDuchodu)}.`,
            "best"
        ));

        // 2. Předčasný
        if (rokyDoDuchodu <= MAXPREDCASNY) {
            const reduction = (rokyDoDuchodu * 6) / 100;
            const vysledekPredcasny = osoba.spocitejDuchod(osoba.efektivniDoba, reduction, 0);

            scenare.push(new Scenar(
                "early_pension",
                "Předčasný důchod (Teď)",
                vysledekPredcasny,
                `Odchod o **${rokyDoDuchodu.toFixed(1)} let dříve**. Důchod bude **trvale nižší** o sankci.`,
                "warn"
            ));
        } else {
            const ageEligible = osoba.duchodovyVek - MAXPREDCASNY;
            const yearEligible = Math.floor(dnes.getFullYear() + rokyDoDuchodu - MAXPREDCASNY);

            scenare.push(new Scenar(
                "early_impossible",
                "Předčasný důchod",
                0,
                `Zatím nemáte nárok na předčasný důchod. Možné nejdříve v **${ageEligible.toFixed(1)} letech** (v roce ${yearEligible}).`,
                "neutral"
            ));
        }

        // 3. Přesluhování (pouze < 5 let do důchodu)
        if (rokyDoDuchodu <= 5) {
            const resultMax = osoba.spocitejDuchod(celkovaDoba + 1, 0, 0.06);
            scenare.push(new Scenar(
                "future_defer",
                "Práce rok navíc (Přesluhování)",
                resultMax,
                "Pokud v budoucnu odložíte důchod o 1 rok, získáte **bonus cca 6 %**.",
                "neutral"
            ));
        }
    }
    return scenare;
}

function parseInput(request) {
    const { salary, years, birthDate, gender, children, substituteYears } = request.query || {};

    const vymerovaciZaklad = parseFloat(salary) || 0;
    const odpracovaneRoky = parseFloat(years) || 0;
    // Převedeme string data na Date objekt
    const datumNarozeni = birthDate ? new Date(birthDate) : null;
    const pocetDeti = parseFloat(children) || 0;
    const nahradniRoky = parseFloat(substituteYears) || 0;
    const pohlavi = gender || 'M';

    return { vymerovaciZaklad, odpracovaneRoky, datumNarozeni, pocetDeti, nahradniRoky, pohlavi };
}

function validateInput(data) {
    if (data.vymerovaciZaklad < 0 || data.odpracovaneRoky < 0 || data.pocetDeti < 0 || data.nahradniRoky < 0) {
        return new Error('Všechny číselné hodnoty musí být nezáporné.');
    }

    // Validace data
    if (!data.datumNarozeni || isNaN(data.datumNarozeni.getTime())) {
        return new Error('Zadejte platné datum narození.');
    }

    // Kontrola rozsahu roku (1920 - dnes minus 15 let)
    const rokNarozeni = data.datumNarozeni.getFullYear();
    const aktualniRok = dnes.getFullYear();

    if (data.odpracovaneRoky - 1 > aktualniRok - rokNarozeni) {
        return new Error('Počet odpracovaných let nemůže být větší než váš aktuální věk.');
    }

    if (rokNarozeni < 1920 || rokNarozeni > aktualniRok - 15) {
        return new Error('Neplatný ročník narození. Zadejte rok mezi 1920 a ' + (aktualniRok - 15) + ".");
    }

    if (data.pohlavi !== 'M' && data.pohlavi !== 'F') {
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
        const osoba = new Osoba(parsedData);
        const scenare = generujScenare(osoba);
        response.status(200).json({ scenarios: scenare });
    } catch (error) {
        console.error("Chyba výpočtu:", error);
        response.status(500).json({ error: "Interní chyba výpočtu." });
    }
}