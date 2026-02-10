document.addEventListener('DOMContentLoaded', () => {
    const birthDateInput = document.getElementById('birthDate');
    if (birthDateInput) {
        const today = new Date();
        today.setFullYear(today.getFullYear() - 15);
        birthDateInput.setAttribute('max', today.toISOString().split('T')[0]);
    }
});

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

async function spocitejDuchod() {
    const salary = document.getElementById('salary').value;
    const years = document.getElementById('years').value;
    const birthDate = document.getElementById('birthDate').value;

    const gender = document.getElementById('gender').value;
    const children = document.getElementById('children').value;
    const substituteYears = document.getElementById('studyYears').value;

    if (!birthDate) {
        alert("Chyba: Zadejte prosím platné datum narození.");
        return;
    }

    const birthDateObj = new Date(birthDate);
    const minDate = new Date('1920-01-01');
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 15);

    if (birthDateObj < minDate || birthDateObj > maxDate) {
        alert("Chyba: Datum narození musí být mezi rokem 1920 a " + maxDate.getFullYear() + ".");
        return;
    }

    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    resultsDiv.innerHTML = '';
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            salary,
            years,
            birthDate,
            gender,
            children,
            substituteYears
        });

        const response = await fetch(`/api/calculate?${params.toString()}`);

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Chyba při komunikaci se serverem.");
        }

        const data = await response.json();
        renderResults(data.scenarios, resultsDiv);

        resultsDiv.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert(error.message);
    } finally {
        loadingDiv.classList.add('hidden');
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
            const formattedAmount = scenar.amount.toLocaleString('cs-CZ', {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0
            });
            amountHtml = `<div class="amount">${formattedAmount} Kč</div>`;
        } else {
            amountHtml = `<div class="amount" style="font-size: 1.5rem; color: #94a3b8;">Není možné</div>`;
        }

        const formattedDesc = scenar.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        card.innerHTML = `
            <h3>${scenar.title}</h3>
            ${amountHtml}
            <p class="desc">${formattedDesc}</p>
        `;
        container.appendChild(card);
    });
}