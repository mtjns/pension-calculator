export default function handler(req, res) {
  // 1. Získáme data z URL (např. ?plat=30000)
  const { plat } = req.query;
  
  // 2. Jednoduchá logika (tady pak dáme ty složité vzorce)
  const castka = Number(plat) || 0;
  const duchod = Math.floor(castka * 0.45); // Zjednodušený odhad

  // 3. Pošleme odpověď zpátky
  res.status(200).json({ 
    zprava: "Výpočet proběhl úspěšně",
    vstupniPlat: castka,
    odhadDuchodu: duchod
  });
}