// api/calculate.js
export default function handler(request, response) {
    // TODO: Remove or restrict CORS support before final production!
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*');

    const { salary, years, age } = request.query;

    const hrubaMzda = parseFloat(salary) || 0;
    const odpracovaneRoky = parseFloat(years) || 0;
    const aktualniVek = parseFloat(age) || 60;

    // --- KONSTANTY (Model 2024/2025) ---
    const DUCHODOVY_VEK = 65;
    const ZAKLADNI_VYMERA = 4440;
    const REDUKCNI_HRANICE_1 = 19346;
    const REDUKCNI_HRANICE_2 = 175868;
    const DOBROVOLNE_POJISTENI = 3100;

    // --- POMOCNÉ FUNKCE ---
    function getRedukovanyZaklad(mzda) {
        if (mzda <= REDUKCNI_HRANICE_1) return mzda;
        if (mzda <= REDUKCNI_HRANICE_2) {
            return REDUKCNI_HRANICE_1 + (mzda - REDUKCNI_HRANICE_1) * 0.26;
        }
        return REDUKCNI_HRANICE_1 + (REDUKCNI_HRANICE_2 - REDUKCNI_HRANICE_1) * 0.26;
    }

    function spocitejDuchod(mzda, roky, kraceni = 0, bonus = 0) {
        const redukovanyZaklad = getRedukovanyZaklad(mzda);

        // Základ: 1.5% za rok
        let procentniVymera = redukovanyZaklad * (roky * 0.015);

        // Krácení (předčasný)
        if (kraceni > 0) procentniVymera = procentniVymera * (1 - kraceni);

        // Bonus (přesluhování - zvyšuje se procentní výměra)
        // Např. bonus 0.06 (6%) znamená, že se výměra vynásobí 1.06
        if (bonus > 0) procentniVymera = procentniVymera * (1 + bonus);

        return Math.floor(ZAKLADNI_VYMERA + procentniVymera);
    }

    // --- LOGIKA SCÉNÁŘŮ ---

    const rokyDoDuchodu = DUCHODOVY_VEK - aktualniVek;
    let scenarios = [];

    // A) UŽ JSEM V DŮCHODOVÉM VĚKU (nebo starší)
    if (rokyDoDuchodu <= 0) {

        // 1. Beru hned
        const vysledek1 = spocitejDuchod(hrubaMzda, odpracovaneRoky, 0);

        // 2. Beru důchod a pracuju k tomu (Souběh)
        // Důchod je stejný, ale příjem je vyšší o mzdu (to tu nepočítáme, ukazujeme jen důchod)
        // Po 360 dnech práce se důchod zvyšuje o 0.4 % (zanedbáme pro MVP)

        // 3. Přesluhuji (Nepoberu důchod, jen pracuju)
        // Za každých 90 dní práce navíc se důchod zvedá o 1.5 % -> 6 % ročně!
        // Simulujeme, že bude přesluhovat 1 rok
        const vysledek3 = spocitejDuchod(hrubaMzda, odpracovaneRoky + 1, 0, 0.06);

        scenarios = [
            {
                id: "now",
                title: "Odchod do důchodu ihned",
                amount: vysledek1,
                desc: "Máte nárok na plný starobní důchod bez krácení.",
                type: "neutral"
            },
            {
                id: "work_pension",
                title: "Práce + Důchod (Souběh)",
                amount: vysledek1,
                desc: "Berete důchod i mzdu. Po roce práce můžete požádat o mírné zvýšení důchodu (0,4 %).",
                type: "best"
            },
            {
                id: "delay",
                title: "Přesluhování (Odklad o 1 rok)",
                amount: vysledek3,
                desc: "Pokud rok nebudete pobírat důchod a budete pracovat, získáte trvale vyšší penzi (cca +6 %).",
                type: "warn" // Warn jen proto, že teď nic nedostaneš
            }
        ];

    }
    // B) JEŠTĚ MI NĚCO CHYBÍ (Původní logika)
    else {
        // Scénář 1: Řádný
        const vysledek1 = spocitejDuchod(hrubaMzda, odpracovaneRoky + rokyDoDuchodu, 0);

        // Scénář 2: Předčasný
        const sankceProcenta = (rokyDoDuchodu * 6) / 100; // cca 6% ročně dolů
        const vysledek2 = spocitejDuchod(hrubaMzda, odpracovaneRoky, sankceProcenta);

        // Scénář 3: Samoplátce
        const nakladyCelkem = DOBROVOLNE_POJISTENI * 12 * rokyDoDuchodu;
        const vysledek3 = spocitejDuchod(hrubaMzda, odpracovaneRoky, 0);

        scenarios = [
            {
                id: "fulltime",
                title: `Řádný důchod (za ${rokyDoDuchodu.toFixed(1)} let)`,
                amount: vysledek1,
                desc: "Pokud vydržíte pracovat až do 65 let.",
                type: "best"
            },
            {
                id: "early",
                title: "Předčasný důchod teď",
                amount: vysledek2,
                desc: `Trvalé krácení o ${(sankceProcenta * 100).toFixed(1)} %.`,
                type: "warn"
            },
            {
                id: "selfpayer",
                title: "Samoplátce (čekání)",
                amount: vysledek3,
                desc: `Doplatíte cca ${nakladyCelkem.toLocaleString('cs-CZ')} Kč a vyhnete se sankci za předčasnost.`,
                cost: nakladyCelkem,
                type: "neutral"
            }
        ];
    }

    response.status(200).json({ scenarios });
}