// script.js
document.getElementById('birthYear').setAttribute('max', new Date().getFullYear() - 15);

function toggleAdvanced() {
    const panel = document.getElementById('advanced-options');
    const btn = document.getElementById('toggleBtn');

    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
    } else {
        panel.classList.add('hidden');
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
    }
}

async function getDuchod() {
    const salary = document.getElementById('salary').value;
    const years = document.getElementById('years').value;
    const birthYear = document.getElementById('birthYear').value;

    const gender = document.getElementById('gender').value;
    const children = document.getElementById('children').value;
    const substituteYears = document.getElementById('substituteYears').value;

    const currentYear = new Date().getFullYear();

    // STRICT VALIDATION
    if (!birthYear || birthYear < 1920 || birthYear > (currentYear - 15)) {
        alert("Chyba: Zadejte prosím platný ročník narození (např. 1968).");
        return;
    }

    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    // UI Reset
    resultsDiv.innerHTML = '';
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            salary, years, birthYear, gender, children, substituteYears
        });

        const response = await fetch(`/api/calculate?${params.toString()}`);

        // Handle explicit backend errors (like bad validation)
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Chyba při komunikaci se serverem.");
        }

        const data = await response.json();
        renderResults(data.scenarios, resultsDiv);

    } catch (error) {
        console.error(error);
        alert(error.message); // Show the specific error message to user
    } finally {
        loadingDiv.classList.add('hidden');
        resultsDiv.classList.remove('hidden');
    }
}

function renderResults(scenarios, container) {
    if (!scenarios || scenarios.length === 0) {
        container.innerHTML = '<p>Pro zadané údaje nebyly nalezeny žádné scénáře.</p>';
        return;
    }

    scenarios.forEach(scenar => {
        const card = document.createElement('div');
        card.className = `card ${scenar.type}`;

        let amountHtml = '';
        if (scenar.amount > 0) {
            // Bez desetinných míst
            const formattedAmount = scenar.amount.toLocaleString('cs-CZ', {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0
            });
            amountHtml = `<div class="amount">${formattedAmount} Kč</div>`;
        } else {
            amountHtml = `<div class="amount" style="font-size: 1.5rem; color: #94a3b8;">Není možné</div>`;
        }

        // Bold text fix
        const formattedDesc = scenar.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        card.innerHTML = `
            <h3>${scenar.title}</h3>
            ${amountHtml}
            <p class="desc">${formattedDesc}</p>
        `;
        container.appendChild(card);
    });
}