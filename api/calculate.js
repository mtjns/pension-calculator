/**
 * @file Hlavní logika pro výpočet důchodu na základě zadaných dat o kariéře a osobních údajů.
 * @see {@link ../rules.md} Detailní pravidla a výpočty
 */


const today = new Date();
const ZAKLADNI_VYMERA = 4440; // 2025
const REDUKCNI_HRANICE_1 = 19346;
const KOEF_REDUKNCI_HRANICE_1 = 0.26;
const REDUKCNI_HRANICE_2 = 175868;
const MAXPREDCASNY = 3;
const KOEFICIENT_NAHRADNI_DOBA = 0.8;
const MIN_PROCENTNI_VYMERA = 770;
const DATE_2010 = new Date('2010-01-01');

// Přepočítací koeficienty pro úpravu vyměřovacích základů (odhad pro rok 2025 dle dat 2024)
/** @see [OVZ-01: Indexace](../rules.md) */
const YEAR_COEFS = {
    2024: 1.0000, 2023: 1.0845, 2022: 1.1567, 2021: 1.2289, 2020: 1.3012,
    2019: 1.3734, 2018: 1.4457, 2017: 1.5179, 2016: 1.5902, 2015: 1.6624,
    2014: 1.7347, 2013: 1.8069, 2012: 1.8792, 2011: 1.9514, 2010: 2.0237,
    2009: 2.0959, 2008: 2.1682, 2007: 2.2404, 2006: 2.3127, 2005: 2.3849,
    2004: 2.4572, 2003: 2.5294, 2002: 2.6017, 2001: 2.6739, 2000: 2.7462,
    1999: 2.8184, 1998: 2.8907, 1997: 2.9629, 1996: 3.0352, 1995: 3.1797,
    1994: 3.5123, 1993: 3.9876, 1992: 4.6543, 1991: 5.4321, 1990: 6.7890,
    1989: 8.1234, 1988: 9.5432, 1987: 11.2345, 1986: 13.4567
};

function processSegments(segments) {
    let odpracovaneDnyCelkem = 0;
    let nahradniDnyCelkem = 0;
    let indexovaneVydelkyCelkem = 0;

    // Procházíme všechny segmenty kariéry
    for (const seg of segments) {
        const start = new Date(seg.startDate);
        const end = new Date(seg.endDate);

        // Výpočet celkového trvání segmentu ve dnech
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (seg.type === 'work') {
            odpracovaneDnyCelkem += days;

            // Pro výpočet výdělku musíme segment rozdělit na jednotlivé roky,
            // abychom mohli aplikovat správný koeficient pro každý rok.
            let currentYear = start.getFullYear();
            let endYear = end.getFullYear();

            // Iterace přes roky v rámci jednoho segmentu
            for (let y = currentYear; y <= endYear; y++) {
                // Určení začátku a konce v daném roce
                const yearStart = new Date(Math.max(start, new Date(`${y}-01-01`)));
                const yearEnd = new Date(Math.min(end, new Date(`${y}-12-31`)));

                // Počet dní v tomto roce v rámci segmentu
                const daysInYear = Math.ceil(Math.abs(yearEnd - yearStart) / (1000 * 60 * 60 * 24));

                // Poměrná část roku (pro výpočet výdělku)
                const ratio = daysInYear / 365.25;

                // Hrubý výdělek v daném roce (měsíční mzda * 12 * poměr)
                const hrubyVydelekRok = seg.salary * 12 * ratio;

                // Aplikace inflačního koeficientu (indexace)
                /** @see [OVZ-01: Indexace](../rules.md) */
                const koeficient = YEAR_COEFS[y] || 1.0;
                indexovaneVydelkyCelkem += (hrubyVydelekRok * koeficient);
            }

        }
        else if (seg.type === 'study') {
            // Logika pro studium: Počítá se jen doba PŘED rokem 2010
            let efektivniDnyStudia = 0;

            /** @see [OVZ-02: Studium do](../rules.md) */
            if (start < DATE_2010) {
                if (end < DATE_2010) {
                    efektivniDnyStudia = days;
                } else {
                    // Segment přechází přes rok 2010 -> ořízneme
                    const diffPre2010 = Math.abs(DATE_2010 - start);
                    efektivniDnyStudia = Math.ceil(diffPre2010 / (1000 * 60 * 60 * 24));
                }
            }
            // Aplikace redukce na 80 %
            nahradniDnyCelkem += (efektivniDnyStudia * KOEFICIENT_NAHRADNI_DOBA);
        }
    }

    // Převod na roky pro finální výpočet
    const odpracovaneRoky = odpracovaneDnyCelkem / 365.25;
    const nahradniRoky = nahradniDnyCelkem / 365.25;

    // Výpočet průměrné měsíční mzdy (OVZ) z indexovaných výdělků
    // OVZ = Celkové indexované příjmy / Celková doba pojištění (odpracovaná) / 12 měsíců
    const prumernaMzda = odpracovaneRoky > 0 ? (indexovaneVydelkyCelkem / odpracovaneRoky / 12) : 0;

    return {
        workedYears: odpracovaneRoky,
        substituteYears: nahradniRoky,
        averageSalary: Math.round(prumernaMzda)
    };
}

class Osoba {
    constructor(data, stats) {
        this.rocnik = new Date(data.birthDate).getFullYear();
        this.datumNarozeni = new Date(data.birthDate);
        this.pocetDeti = data.children || 0;
        this.pohlavi = data.gender || 'M';

        // Použití vypočítaných statistik
        this.odpracovaneRoky = stats.workedYears;
        this.nahradniRoky = stats.substituteYears;
        this.prumernaMzda = stats.averageSalary;
    }

    get aktualniVek() {
        const diffTime = Math.abs(today - this.datumNarozeni);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays / 365.25;
    }

    get efektivniDoba() {
        return this.odpracovaneRoky + this.nahradniRoky;
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
        // Aplikace redukčních hranic na OVZ (Osobní vyměřovací základ)
        /** @see [CALC-01: Redukční hranice](../rules.md) */
        if (this.prumernaMzda > REDUKCNI_HRANICE_1) {
            if (this.prumernaMzda > REDUKCNI_HRANICE_2) {
                // Nad druhou hranici se započítává 26% z rozdílu mezi 1. a 2. hranicí
                // (zjednodušeno pro tento model, reálně je to složitější pásmo)
                return REDUKCNI_HRANICE_1 + (REDUKCNI_HRANICE_2 - REDUKCNI_HRANICE_1) * KOEF_REDUKNCI_HRANICE_1;
            } else {
                // Mezi 1. a 2. hranicí se započítává 26%
                return REDUKCNI_HRANICE_1 + (this.prumernaMzda - REDUKCNI_HRANICE_1) * KOEF_REDUKNCI_HRANICE_1;
            }
        } else {
            // Do první hranice se započítává 100%
            return this.prumernaMzda;
        }
    }

    spocitejDuchod(celkovaDoba, koeficientKraceni = 0, koeficientBonus = 0) {
        // Výpočet procentní výměry (1.5 % za každý rok pojištění)
        let procentniCast = this.redukovanyZaklad * (celkovaDoba * 0.015);

        // Zajištění minimální výše procentní výměry
        procentniCast = Math.max(MIN_PROCENTNI_VYMERA, procentniCast);

        // Přičtení výchovného
        const bonusZaDeti = this.pocetDeti * 500;

        // Aplikace sankcí (předčasný) nebo bonusů (přesluhování)
        if (koeficientKraceni > 0) procentniCast *= (1 - koeficientKraceni);
        if (koeficientBonus > 0) procentniCast *= (1 + koeficientBonus);

        // Celkový důchod = Základní výměra + Procentní výměra + Výchovné
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
            `Váš cílový důchod v roce ${Math.floor(today.getFullYear() + rokyDoDuchodu)}.`,
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
            const yearEligible = Math.floor(today.getFullYear() + rokyDoDuchodu - MAXPREDCASNY);

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

export default function handler(request, response) {
    if (process.env.NODE_ENV === 'development') {
        response.setHeader('Access-Control-Allow-Credentials', true);
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
        response.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    }

    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    if (request.method !== 'POST') {
        response.status(405).json({ error: "Method Not Allowed. Please use POST." });
        return;
    }

    let inputData = request.body;

    if (typeof inputData === 'string') {
        try {
            inputData = JSON.parse(inputData);
        } catch (e) {
            response.status(400).json({ error: "Invalid JSON body" });
            return;
        }
    }

    if (!inputData || !inputData.birthDate) {
        response.status(400).json({ error: "Chybí datum narození." });
        return;
    }

    try {
        // 1. Zpracování historie (vně třídy)
        const stats = processSegments(inputData.segments || []);

        // 2. Vytvoření osoby s vypočtenými statistikami
        const osoba = new Osoba(inputData, stats);

        // 3. Generování scénářů
        const scenare = generujScenare(osoba);

        response.status(200).json({ scenarios: scenare });
    } catch (error) {
        console.error("Chyba výpočtu:", error);
        response.status(500).json({ error: "Interní chyba výpočtu: " + error.message });
    }
}