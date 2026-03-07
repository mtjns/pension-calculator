# Legislativa
Zde se nachází vše potřebné pro výpočet starobních důchodů, jež vyplácí ČSSZ - tedy všech s výjimkou vojáků z povolání, policistů, hasičů, příslušníků BIS, Vězeňské
služby ČR a Celní správy ČR.

## Přidat / chybí
- Podmínky pro přiznání důchodu (min doba pojištění)
- Předčasný důchod
- Náhradní doba pojištění nemá pokryté všechny případy
- Výpočet základní výměry

## Návrh na implementaci
V implementaci náhradní doby pojištění bych navrhoval rozdělit doby na 2 kategorie podle koeficientů. V API rozhodně a možná i někde v UI?, jelikož všechny případy nejsou zdokumentovány a soudě podle procházení novel zákonů se neustále mění

## Podmínky pro přiznání důchodu
### Důchodový věk
- **Pro narozené před 1936**
    - 60 let pro muže
    - 57 let pro ženy
        - 1 dítě = 56 let
        - 2 děti = 55 let
        - 3-4 děti = 54 let
        - 5 a více dětí = 53 let
- **Pro narozené mezi 1936 a 1973**
    <details>
    <summary>📊 Klikněte pro zobrazení JSON dat</summary>
    ```JSON
    {
    "1936":{"male":{"years":60,"months":2},"female":{"0":{"years":57,"months":0},"1":{"years":56,"months":0},"2":{"years":55,"months":0},"3-4":{"years":54,"months":0},"5+":{"years":53,"months":0}}},
    "1937":{"male":{"years":60,"months":4},"female":{"0":{"years":57,"months":0},"1":{"years":56,"months":0},"2":{"years":55,"months":0},"3-4":{"years":54,"months":0},"5+":{"years":53,"months":0}}},
    "1938":{"male":{"years":60,"months":6},"female":{"0":{"years":57,"months":0},"1":{"years":56,"months":0},"2":{"years":55,"months":0},"3-4":{"years":54,"months":0},"5+":{"years":53,"months":0}}},
    "1939":{"male":{"years":60,"months":8},"female":{"0":{"years":57,"months":4},"1":{"years":56,"months":0},"2":{"years":55,"months":0},"3-4":{"years":54,"months":0},"5+":{"years":53,"months":0}}},
    "1940":{"male":{"years":60,"months":10},"female":{"0":{"years":57,"months":8},"1":{"years":56,"months":4},"2":{"years":55,"months":0},"3-4":{"years":54,"months":0},"5+":{"years":53,"months":0}}},
    "1941":{"male":{"years":61,"months":0},"female":{"0":{"years":58,"months":0},"1":{"years":56,"months":8},"2":{"years":55,"months":4},"3-4":{"years":54,"months":0},"5+":{"years":53,"months":0}}},
    "1942":{"male":{"years":61,"months":2},"female":{"0":{"years":58,"months":4},"1":{"years":57,"months":0},"2":{"years":55,"months":8},"3-4":{"years":54,"months":4},"5+":{"years":53,"months":0}}},
    "1943":{"male":{"years":61,"months":4},"female":{"0":{"years":58,"months":8},"1":{"years":57,"months":4},"2":{"years":56,"months":0},"3-4":{"years":54,"months":8},"5+":{"years":53,"months":4}}},
    "1944":{"male":{"years":61,"months":6},"female":{"0":{"years":59,"months":0},"1":{"years":57,"months":8},"2":{"years":56,"months":4},"3-4":{"years":55,"months":0},"5+":{"years":53,"months":8}}},
    "1945":{"male":{"years":61,"months":8},"female":{"0":{"years":59,"months":4},"1":{"years":58,"months":0},"2":{"years":56,"months":8},"3-4":{"years":55,"months":4},"5+":{"years":54,"months":0}}},
    "1946":{"male":{"years":61,"months":10},"female":{"0":{"years":59,"months":8},"1":{"years":58,"months":4},"2":{"years":57,"months":0},"3-4":{"years":55,"months":8},"5+":{"years":54,"months":4}}},
    "1947":{"male":{"years":62,"months":0},"female":{"0":{"years":60,"months":0},"1":{"years":58,"months":8},"2":{"years":57,"months":4},"3-4":{"years":56,"months":0},"5+":{"years":54,"months":8}}},
    "1948":{"male":{"years":62,"months":2},"female":{"0":{"years":60,"months":4},"1":{"years":59,"months":0},"2":{"years":57,"months":8},"3-4":{"years":56,"months":4},"5+":{"years":55,"months":0}}},
    "1949":{"male":{"years":62,"months":4},"female":{"0":{"years":60,"months":8},"1":{"years":59,"months":4},"2":{"years":58,"months":0},"3-4":{"years":56,"months":8},"5+":{"years":55,"months":4}}},
    "1950":{"male":{"years":62,"months":6},"female":{"0":{"years":61,"months":0},"1":{"years":59,"months":8},"2":{"years":58,"months":4},"3-4":{"years":57,"months":0},"5+":{"years":55,"months":8}}},
    "1951":{"male":{"years":62,"months":8},"female":{"0":{"years":61,"months":4},"1":{"years":60,"months":0},"2":{"years":58,"months":8},"3-4":{"years":57,"months":4},"5+":{"years":56,"months":0}}},
    "1952":{"male":{"years":62,"months":10},"female":{"0":{"years":61,"months":8},"1":{"years":60,"months":4},"2":{"years":59,"months":0},"3-4":{"years":57,"months":8},"5+":{"years":56,"months":4}}},
    "1953":{"male":{"years":63,"months":0},"female":{"0":{"years":62,"months":0},"1":{"years":60,"months":8},"2":{"years":59,"months":4},"3-4":{"years":58,"months":0},"5+":{"years":56,"months":8}}},
    "1954":{"male":{"years":63,"months":2},"female":{"0":{"years":62,"months":4},"1":{"years":61,"months":0},"2":{"years":59,"months":8},"3-4":{"years":58,"months":4},"5+":{"years":57,"months":0}}},
    "1955":{"male":{"years":63,"months":4},"female":{"0":{"years":62,"months":8},"1":{"years":61,"months":4},"2":{"years":60,"months":0},"3-4":{"years":58,"months":8},"5+":{"years":57,"months":4}}},
    "1956":{"male":{"years":63,"months":6},"female":{"0":{"years":63,"months":2},"1":{"years":61,"months":8},"2":{"years":60,"months":4},"3-4":{"years":59,"months":0},"5+":{"years":57,"months":8}}},
    "1957":{"male":{"years":63,"months":8},"female":{"0":{"years":63,"months":8},"1":{"years":62,"months":2},"2":{"years":60,"months":8},"3-4":{"years":59,"months":4},"5+":{"years":58,"months":0}}},
    "1958":{"male":{"years":63,"months":10},"female":{"0":{"years":63,"months":10},"1":{"years":62,"months":8},"2":{"years":61,"months":2},"3-4":{"years":59,"months":8},"5+":{"years":58,"months":4}}},
    "1959":{"male":{"years":64,"months":0},"female":{"0":{"years":64,"months":0},"1":{"years":63,"months":2},"2":{"years":61,"months":8},"3-4":{"years":60,"months":2},"5+":{"years":58,"months":8}}},
    "1960":{"male":{"years":64,"months":2},"female":{"0":{"years":64,"months":2},"1":{"years":63,"months":8},"2":{"years":62,"months":2},"3-4":{"years":60,"months":8},"5+":{"years":59,"months":2}}},
    "1961":{"male":{"years":64,"months":4},"female":{"0":{"years":64,"months":4},"1":{"years":64,"months":2},"2":{"years":62,"months":8},"3-4":{"years":61,"months":2},"5+":{"years":59,"months":8}}},
    "1962":{"male":{"years":64,"months":6},"female":{"0":{"years":64,"months":6},"1":{"years":64,"months":6},"2":{"years":63,"months":2},"3-4":{"years":61,"months":8},"5+":{"years":60,"months":2}}},
    "1963":{"male":{"years":64,"months":8},"female":{"0":{"years":64,"months":8},"1":{"years":64,"months":8},"2":{"years":63,"months":8},"3-4":{"years":62,"months":2},"5+":{"years":60,"months":8}}},
    "1964":{"male":{"years":64,"months":10},"female":{"0":{"years":64,"months":10},"1":{"years":64,"months":10},"2":{"years":64,"months":2},"3-4":{"years":62,"months":8},"5+":{"years":61,"months":2}}},
    "1965":{"male":{"years":65,"months":0},"female":{"0":{"years":65,"months":0},"1":{"years":65,"months":0},"2":{"years":64,"months":8},"3-4":{"years":63,"months":2},"5+":{"years":61,"months":8}}},
    "1966":{"male":{"years":65,"months":1},"female":{"0":{"years":65,"months":1},"1":{"years":65,"months":1},"2":{"years":65,"months":1},"3-4":{"years":63,"months":8},"5+":{"years":62,"months":2}}},
    "1967":{"male":{"years":65,"months":2},"female":{"0":{"years":65,"months":2},"1":{"years":65,"months":2},"2":{"years":65,"months":2},"3-4":{"years":64,"months":2},"5+":{"years":62,"months":8}}},
    "1968":{"male":{"years":65,"months":3},"female":{"0":{"years":65,"months":3},"1":{"years":65,"months":3},"2":{"years":65,"months":3},"3-4":{"years":64,"months":8},"5+":{"years":63,"months":2}}},
    "1969":{"male":{"years":65,"months":4},"female":{"0":{"years":65,"months":4},"1":{"years":65,"months":4},"2":{"years":65,"months":4},"3-4":{"years":65,"months":2},"5+":{"years":63,"months":8}}},
    "1970":{"male":{"years":65,"months":5},"female":{"0":{"years":65,"months":5},"1":{"years":65,"months":5},"2":{"years":65,"months":5},"3-4":{"years":65,"months":5},"5+":{"years":64,"months":2}}},
    "1971":{"male":{"years":65,"months":6},"female":{"0":{"years":65,"months":6},"1":{"years":65,"months":6},"2":{"years":65,"months":6},"3-4":{"years":65,"months":6},"5+":{"years":64,"months":8}}},
    "1972":{"male":{"years":65,"months":7},"female":{"0":{"years":65,"months":7},"1":{"years":65,"months":7},"2":{"years":65,"months":7},"3-4":{"years":65,"months":7},"5+":{"years":65,"months":2}}},
    "1973":{"male":{"years":65,"months":8},"female":{"0":{"years":65,"months":8},"1":{"years":65,"months":8},"2":{"years":65,"months":8},"3-4":{"years":65,"months":8},"5+":{"years":65,"months":8}}}
    }
    ``` </details>
- **Pro narozené mezi 1974 a 1988**
    - 65 let a 8 měsíců + [(Rok narození - 1973) * 1 měsíc]
- **Pro narozené po 1988**
    - 67 let (existují výjimky pro práce I. kategorie = horníci a letci)

## Rovnice pro výpočet důchodu (úvodní)
Pomocí těchto rovnic se spočítá důchod, navyšování důchodu pro stávající důchodce závisí na odlišném mechanismu valorizace důchodů (v závislosti na průměrné mzdě a inflaci).

$$\boxed{\text{celkový důchod} = \text{základní výměra} + \text{procentní výměra}}$$

- Základní výměra je pro každý rok pevná konstanta (10% průměrné mzdy) a zároveň pro všechny důchodce stejná.

$$ \boxed{\text{procentní výměra} = \text{výpočtový základ} \times \text{doba pojištění (roky)} \times \text{procentuální sazba}}$$

- Výpočtový základ
- [Doba pojištění](#doba-pojištění)
- [Procentuální sazba](#procentulní-sazba)

[Výpočet a vyplata důchodu - ČSSZ](https://www.cssz.cz/web/cz/vypocet-a-vyplata-duchodu)

## Redukce osobního vyměřovacího základu
Momentální hranice pro redukci osobního vyměřovacího základu. Částky jsou každoročně přepočítávané konstanty a procenta se mění podle obrázku níže.
![Redukce osobního vyměřovacího základu - ČSSZ](legal_images/redukce_vym_zakladu.png)

První hranice redukce osobního vyměřovacího základu se snižuje v důsledku důchodové reformy (2025), podle obrázku.
![Pokles první hranice v důsledku důchodové reformy - ČSSZ](legal_images/pokles_prvni_hranice.png)

[Výpočet a vyplata důchodu - ČSSZ](https://www.cssz.cz/web/cz/vypocet-a-vyplata-duchodu)  
[Důchodová reforma - ČSSZ](https://www.cssz.cz/duchodova-reforma)

## Procentulní sazba
![Snižování procentní sazby v důsledku důchodové reformy - ČSSZ](legal_images/redukce_procent_sazby.png)
[Důchodová reforma - ČSSZ](https://www.cssz.cz/duchodova-reforma)

## Doba pojištění
zaokrouhuje se na celé roky dolů

### Řádná doba pojištění
= doba, po kterou státu odvádíte pojistné. Patří sem:  
- zaměstnání
- podnikání
- dobrovolná platba sociálního pojištění
- brigády
    - DPP se započítává, přesahuje-li příjem 12 000 Kč měsíčně
    - DPČ se započítává, jestliže příjem přesahuje 4 500 Kč měsíčně

### Náhradní doba pojištění
= doba během které se neodvádí pojistné, ale přesto se započítává do let pojištění pro důchod. Náhradní doba se dělí na 2 kategorie:
- Plné přiznání doby pojištění
    - **Péče o dítě::** osobní péče, max 4 roky o vlastní, max 3 roky o cizí dítě
    - **Studium před 1996:** do 18 let věku osoby
    - **Manželka prezidenta:** republiky
- Přiznání 80% doby pojištění: zaokrouhluje se na celé dny nahoru
    - **SŠ, VŠ a VOŠ studium:** počítá se max 6 let; od završení 18 let věku osoby a pouze před rokem 2010
    - **Doktorské studium:** počítají se max 4 roky; pouze pro první a prezenční doktorské studium v ČR a absolvované po 2009
    - **Ochrana svědků
    - **Nemoc, karanténa, ošetřovné:** pokud vznikli během práce nebo v ochranné lhůtě - 7 dní
    - **Civilní služba:** do 2004

#### Poznámky:
- Při nemoci během průběhu zaměstnání se doba normálně započítává

#### Skipped
- pobírači invalidního důchodu a osoby, co by teoreticky mohly, ale nepobírají (∞)
- vojenská služba (asi 10 větví podle typu a doby služby)
- pěstounská péče (max 2 roky od prvního příspěvku)
- úřad práce (až 3 roky)
- osoby se zdravotním postižením v přípravě na zaměstnání (∞)
- péče o závislou osobu
    - do 10 let / jakýkoli věk (dle míry závislosti)
    - podmínka společné domácnosti (výjimka: blízká osoba nebo asistent sociální péče)

[Náhradní doba pojištění - ČSSZ](https://www.cssz.cz/nahradni-doba-pojisteni)  
[Zákon o důchodovém pojištění §5 - Kurzy.cz](https://www.kurzy.cz/zakony/155-1995-zakon-o-duchodovem-pojisteni/paragraf-5/#paragraf-5H2Ic^G5H2Id+G5H2Ih)  
[Studium před 1996 - E15](https://www.e15.cz/finexpert/duchody/pocita-se-studium-na-vysoke-skole-do-duchodu-navod-jak-postupovat-1427803)  
[Manželka prezidenta republiky](https://zakony.penize.cz/zakon-c-417-2024-sb-kterym-se-meni-zakon-c-155-1995-sb-o-duchodovem-pojisteni-ve-zneni-pozdejsich-predpisu-a-dalsi-souvisejici-zakony/2#obsah-zakona)  

## Potencionálně užitečné odkazy
- [Příručka Důchodce 2026](https://www.cssz.cz/documents/20143/1045831/2026_P%C5%99%C3%ADru%C4%8Dka%20budouc%C3%ADho%20d%C5%AFchodce%20(2026)_web.pdf/fb6f23b0-fdbd-4373-9a01-9d890865cfb9)