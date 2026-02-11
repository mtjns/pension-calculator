# Czech Pension Calculator (Důchodová kalkulačka 2025)

A web application designed to help users estimate their future old-age pension in the Czech Republic. It allows users to model their career history using detailed segments (work, study, gaps) and compares different retirement scenarios (regular, early, deferred).

## Project Overview

* **Frontend:** Vanilla HTML, CSS, and JavaScript. No frameworks or build steps required.
* **Backend:** Vercel Serverless Functions (Node.js) handling the calculation logic.
* **Deployment:** Optimized for Vercel.

## Project Structure

```text
/
├── api/
│   └── calculate.js       # The "Brain". Handles all math, legislation rules, and API responses.
├── public/
│   ├── index.html         # Main UI structure.
│   ├── style.css          # Custom styling (CSS variables, responsive grid, card designs).
│   ├── script.js          # Frontend logic: Segment builder, drag-and-drop, API calls.
│   └── favicon.svg        # Application icon.
├── API.md                 # Detailed API documentation.
└── README.md              # Project documentation.
```

## Core Logic

### 1. Frontend (`public/script.js`)

The frontend is responsible for collecting user data through an interactive "Journey Builder".

* **Segment System:** Instead of entering a single number for "years worked", users build a timeline of segments (e.g., "Study 4 years", then "Work 5 years", then "Gap 1 year").
* **Timeline Visualization:** Renders a visual bar representing the user's career relative to their retirement age.
* **Data Aggregation:** Before sending data to the API, the frontend calculates the start and end dates for each segment based on the user's birth date to create a chronological history.

### 2. Backend (`api/calculate.js`)

The backend contains the legislative logic for the Czech pension system (Model 2025).

* **Date Processing:** Iterates through the provided segments to calculate exact days of insurance.
  * *Study Logic:* Applies specific coefficients (e.g., 0.8) to study periods.
* **Earnings Indexing:** Uses a dictionary of **Year Coefficients (`YEAR_COEFS`)** to convert historical earnings into their present value (PV).
* **Pension Formula:**
  * **OVZ (Personal Assessment Base):** Calculates the average monthly income from indexed earnings.
  * **Reduction:** Applies the official reduction thresholds (Redukční hranice) to the OVZ.
  * **Calculation:** Computes the "Percentage Assessment" (1.5% per year of insurance) + "Basic Assessment" (Fixed amount).
* **Scenario Generation:**
  * If the user has reached retirement age, it returns options for **Immediate Retirement**, **Concurrent Work & Pension**, and **Deferred Retirement**.
  * If the user is younger, it projects **Regular Future Retirement**, **Early Retirement** (with penalties), or **Deferred Future Retirement**.
