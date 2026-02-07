// api/calculate.js
export default function handler(request, response) {
  // TODO: Remove or restrict CORS support before final production!
  // Currently set to '*' to allow localhost development.
  // In production, check: if (request.headers.origin !== 'https://tvoje-domena.vercel.app') return response.status(403).send('Forbidden');
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');

  
  // 1. Získání vstupů
  const { salary, years, age } = request.query;
  
  // Převod na čísla
  const hrubaMzda = parseFloat(salary) || 0;
  const odpracovaneRoky = parseFloat(years) || 0;
  const aktualniVek = parseFloat(age) || 60;

  // --- KONSTANTY (Model 2024/2025) ---
  const DUCHODOVY_VEK = 65;
  const ZAKLADNI_VYMERA = 4440; // Fixní částka pro všechny
  const REDUKCNI_HRANICE_1 = 19346; // 100% zápočet
  const REDUKCNI_HRANICE_2 = 175868; // 26% zápočet
  
  // Cena dobrovolného pojištění (2024: cca 3078 Kč)
  const DOBROVOLNE_POJISTENI = 3100; 

  // --- POMOCNÉ FUNKCE ---

  // Výpočet Osobního vyměřovacího základu (zjednodušeně redukce)
  function getRedukovanyZaklad(mzda) {
    if (mzda <= REDUKCNI_HRANICE_1) return mzda;
    
    if (mzda <= REDUKCNI_HRANICE_2) {
      return REDUKCNI_HRANICE_1 + (mzda - REDUKCNI_HRANICE_1) * 0.26;
    }
    
    // Nad druhou hranici se už nic nepočítá (strop)
    return REDUKCNI_HRANICE_1 + (REDUKCNI_HRANICE_2 - REDUKCNI_HRANICE_1) * 0.26;
  }

  // Hlavní výpočet důchodu
  function spocitejDuchod(mzda, roky, kraceni = 0) {
    const redukovanyZaklad = getRedukovanyZaklad(mzda);
    
    // Procentní výměra: 1.5% za každý rok pojištění
    // (Minimálně 1 rok, jinak 0)
    let procentniVymera = redukovanyZaklad * (roky * 0.015);
    
    // Aplikace krácení za předčasnost (trvalé snížení)
    // kraceni je např 0.15 (15%)
    if (kraceni > 0) {
        procentniVymera = procentniVymera * (1 - kraceni);
    }

    // Výsledek = Základní výměra + Procentní výměra
    // (min. 770 Kč procentní výměra dle zákona, ale to zanedbáme)
    return Math.floor(ZAKLADNI_VYMERA + procentniVymera);
  }

  // --- SCÉNÁŘE ---
  
  const rokyDoDuchodu = DUCHODOVY_VEK - aktualniVek;

  // 1. SCÉNÁŘ: Řádný důchod (Full-time práce až do 65)
  const vysledek1 = spocitejDuchod(hrubaMzda, odpracovaneRoky + rokyDoDuchodu, 0);

  // 2. SCÉNÁŘ: Předčasný důchod (Jdu hned, mám brigádu)
  // Sankce: Velmi zjednodušeně 1.5% za každých 90 dní předčasnosti -> cca 6% ročně
  const sankceProcenta = (rokyDoDuchodu * 6) / 100; 
  const vysledek2 = spocitejDuchod(hrubaMzda, odpracovaneRoky, sankceProcenta);
  
  // 3. SCÉNÁŘ: Samoplátce (Seknu s tím, platím si to sám, čekám na 65)
  // Nemám sankci, ale mám méně odpracovaných let (nepracuju ty zbylé roky)
  const nakladyCelkem = DOBROVOLNE_POJISTENI * 12 * rokyDoDuchodu;
  const vysledek3 = spocitejDuchod(hrubaMzda, odpracovaneRoky, 0); // Bez sankce, ale méně let než Scénář 1

  // Odeslání JSON
  response.status(200).json({
    scenarios: [
      {
        id: "fulltime",
        title: "Práce až do 65 let",
        amount: vysledek1,
        desc: "Řádný důchod. Nejvyšší možná částka.",
        type: "best"
      },
      {
        id: "early",
        title: "Předčasný důchod teď",
        amount: vysledek2,
        desc: `Trvalé krácení o ${sankceProcenta * 100} %. Pozor na limity přivýdělku!`,
        type: "warn"
      },
      {
        id: "selfpayer",
        title: "Samoplátce (čekání na 65)",
        amount: vysledek3,
        desc: `Důchod bez sankce. Musíte ale doplatit celkem ${nakladyCelkem.toLocaleString('cs-CZ')} Kč na pojištění.`,
        cost: nakladyCelkem,
        type: "neutral"
      }
    ]
  });
}