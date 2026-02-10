let segments = [];

document.addEventListener('DOMContentLoaded', () => {
    const birthDateInput = document.getElementById('birthDate');
    if (birthDateInput) {
        const today = new Date();
        today.setFullYear(today.getFullYear() - 15);
        birthDateInput.setAttribute('max', today.toISOString().split('T')[0]);
    }

    // Add default segment (example)
    addSegmentLogic('work', 35, 42000);
});

// --- SEGMENT LOGIC ---

function addSegment() {
    const type = document.getElementById('newSegType').value;
    const duration = parseFloat(document.getElementById('newSegDuration').value);
    const salary = parseFloat(document.getElementById('newSegSalary').value) || 0;

    if (!duration || duration <= 0) {
        alert("Zadejte prosím platnou délku trvání.");
        return;
    }

    addSegmentLogic(type, duration, salary);

    // Clear inputs
    document.getElementById('newSegDuration').value = '';
    document.getElementById('newSegSalary').value = '';
}

function addSegmentLogic(type, duration, salary) {
    const id = Date.now();
    segments.push({ id, type, duration, salary });
    renderSegments();
}

function removeSegment(id) {
    segments = segments.filter(s => s.id !== id);
    renderSegments();
}

function renderSegments() {
    const list = document.getElementById('segmentList');
    const timeline = document.getElementById('timelineBar');

    list.innerHTML = '';
    timeline.innerHTML = '';

    // Calculate Totals for Display
    let totalYears = 0;
    let totalSubstitute = 0;
    let weightedSalarySum = 0;
    let salaryYears = 0;
    let totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

    segments.forEach(s => {
        // 1. Render List Item
        const item = document.createElement('div');
        item.className = 'segment-item';

        let badgeClass = 'sb-work';
        let label = 'Práce';
        if (s.type === 'study') { badgeClass = 'sb-study'; label = 'Studium'; }
        if (s.type === 'none') { badgeClass = 'sb-none'; label = 'Nic'; }

        let salaryText = s.type === 'work' ? `${s.salary.toLocaleString()} Kč` : '-';

        item.innerHTML = `
            <div class="segment-badge ${badgeClass}">${label}</div>
            <div class="segment-info">
                <span>${s.duration} let</span>
                <span style="color: #64748b;">${salaryText}</span>
            </div>
            <button class="segment-remove" onclick="removeSegment(${s.id})">×</button>
        `;
        list.appendChild(item);

        // 2. Render Timeline Bar
        const bar = document.createElement('div');
        bar.className = `timeline-segment ts-${s.type}`;
        const widthPercent = (s.duration / totalDuration) * 100;
        bar.style.width = `${widthPercent}%`;
        bar.title = `${label}: ${s.duration} let`;
        timeline.appendChild(bar);

        // 3. Update Calc Totals
        if (s.type === 'work') {
            totalYears += s.duration;
            weightedSalarySum += (s.salary * s.duration);
            salaryYears += s.duration;
        } else if (s.type === 'study') {
            totalSubstitute += s.duration;
        }
    });

    // Update Summary UI
    const avgSalary = salaryYears > 0 ? Math.round(weightedSalarySum / salaryYears) : 0;

    document.getElementById('displayYears').innerText = `${totalYears} let`;
    document.getElementById('displaySalary').innerText = `${avgSalary.toLocaleString()} Kč`;
    document.getElementById('displaySubstitute').innerText = `${totalSubstitute} let`;
}

// --- CALCULATION LOGIC ---

async function spocitejDuchod() {
    const birthDate = document.getElementById('birthDate').value;
    const children = document.getElementById('children').value;

    // Get Gender from Radio
    const genderEls = document.getElementsByName('gender');
    let gender = 'M';
    for (let radio of genderEls) {
        if (radio.checked) {
            gender = radio.value;
            break;
        }
    }

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

    // CALCULATE DATA FROM SEGMENTS
    let totalYears = 0;
    let totalSubstitute = 0;
    let weightedSalarySum = 0;
    let salaryYears = 0;

    segments.forEach(s => {
        if (s.type === 'work') {
            totalYears += s.duration;
            weightedSalarySum += (s.salary * s.duration);
            salaryYears += s.duration;
        } else if (s.type === 'study') {
            totalSubstitute += s.duration;
        }
    });

    const salary = salaryYears > 0 ? Math.round(weightedSalarySum / salaryYears) : 0;

    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    resultsDiv.innerHTML = '';
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            salary,
            years: totalYears,
            birthDate,
            gender,
            children,
            substituteYears: totalSubstitute
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