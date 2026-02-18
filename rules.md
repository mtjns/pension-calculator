# Pravidla pro výpočet důchodu (Model 2025)

Na základě zákona ... (Zákon o důchodovém pojištění) a nařízení vlády ...

## 1. Důchodový věk (AGE)

#### AGE-01: Maximální hranice

Důchodový věk nesmí překročit **65 let** u osob narozených po roce 1971.
*(§ 32, odst. 4)*

#### AGE-02: Základ pro muže

Muži narození před rokem 1965 mají postupný důchodový věk začínající na 60 letech, který se zvyšuje o 2 měsíce za každý rok.
*(§ 32, odst. 2)*

#### AGE-03: Ženy a děti

Důchodový věk žen se snižuje na základě počtu vychovaných dětí.
*(§ 32, odst. 3)*

## 2. Vyměřovací základ (OVZ)

Výpočet OVZ

### Roční koeficienty

#### OVZ-01: Indexace

Výdělky z předchozích let musí být vynásobeny přepočítacím koeficientem (`YEAR_COEFS`) pro daný rok, aby odrážely současnou hodnotu peněz.
*(§ 16)*

### Studium

#### OVZ-02: Studium poměr

Doby studia jsou považovány za náhradní dobu pojištění, ale započítávají se pouze z **80 %**.
*(§ 34, odst. 1)*

#### OVZ-03: Studium do

Doby studia se počítají pouze před rokem 2010

## 3. Výpočet a redukce (CALC)

Výpočet důchodu z OVZ

### Redukční hranice

#### CALC-01: Redukční hranice

Výdělky do výše `REDUKCNI_HRANICE_1` (44 % průměrné mzdy) se započítávají ze **100 %**.
*(§ 15)*
 redukční hranice

Výdělky mezi `REDUKCNI_HRANICE_1` a `REDUKCNI_HRANICE_2` (400 % průměrné mzdy) se započítávají z **26 %**.
*(§ 15)*

#### CALC-02: Procentní výměra

Základní procentní výměra činí **1,5 %** z výpočtového základu za každý ukončený rok pojištění.
*(§ 34)*

#### CALC-03: 

#### CALC-04: Bonusy a sankce

* **Předčasný:** Sankce cca 1,5 % za každých 90 dní.

* **Odložený (Přesluhování):** Bonus 1,5 % za každých 90 dní (cca 6 % ročně).
  *(§ 36)*
