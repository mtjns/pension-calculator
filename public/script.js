let segments = [];
let dragSrcEl = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const birthDateInput = document.getElementById('birthDate');

    // Set default date (1975)
    if (birthDateInput) {
        const defaultDate = new Date('1975-01-01');
        birthDateInput.value = defaultDate.toISOString().split('T')[0];
        birthDateInput.addEventListener('change', recalculateUI);
    }

    // Initial Segments (18y Nothing + 35y Work)
    segments = [
        { id: 'init-1', type: 'none', duration: 18, salary: 0 },
        { id: 'init-2', type: 'work', duration: 35, salary: 42000 }
    ];

    renderAll();

    document.addEventListener('click', (e) => {
        if (e.target.closest('.segment-row')) return;

        document.querySelectorAll('.segment-row.expanded').forEach(row => {
            row.classList.remove('expanded');
        });
    });
});

// Helper for Czech declension of years
function formatRoky(count) {
    const val = Math.abs(parseFloat(count));
    if (isNaN(val)) return '0 let';

    // Handle decimals (e.g. 1.5 let)
    if (!Number.isInteger(val)) return `${val} let`;

    if (val === 1) return `${val} rok`;
    if (val >= 2 && val <= 4) return `${val} roky`;
    return `${val} let`;
}

// --- CORE RENDER FUNCTIONS ---

function renderAll() {
    renderList();
    recalculateUI();
}

function renderList() {
    const list = document.getElementById('segmentList');
    list.innerHTML = '';

    segments.forEach((seg, index) => {
        const row = document.createElement('div');
        row.className = 'segment-row';
        row.draggable = true;
        row.dataset.index = index;
        row.id = `seg-row-${index}`;

        // Colors & Text based on type
        let badgeClass = 'badge-work';
        let labelText = 'Práce';
        let salaryText = seg.salary > 0 ? `${seg.salary.toLocaleString()} Kč` : '';

        if (seg.type === 'study') {
            badgeClass = 'badge-study';
            labelText = 'Studium';
            salaryText = '';
        }
        if (seg.type === 'none') {
            badgeClass = 'badge-none';
            labelText = 'Nic';
            salaryText = '';
        }

        // Salary input visibility style
        const salaryStyle = seg.type === 'work' ? '' : 'visibility: hidden;';

        row.innerHTML = `
            <!-- HEADER (Visible) -->
            <div class="segment-header" onclick="expandSegment(event, ${index})">
                <div class="drag-handle" title="Přetáhnout">☰</div>
                <div class="header-badge ${badgeClass}">${labelText}</div>
                <div class="header-info">
                    <span>${formatRoky(seg.duration)}</span>
                    <span class="header-salary">${salaryText}</span>
                </div>
                <span class="edit-hint">Upravit</span>
                <button class="btn-remove" onclick="removeSegment(event, ${index})" title="Odstranit">&times;</button>
            </div>

            <!-- BODY (Slide Out Edit Form) -->
            <div class="segment-body" onclick="event.stopPropagation()">
                <div class="edit-form-grid">
                    <div class="edit-group">
                        <label>Typ činnosti</label>
                        <select onchange="updateSegment(${index}, 'type', this.value)">
                            <option value="none" ${seg.type === 'none' ? 'selected' : ''}>Nic</option>
                            <option value="study" ${seg.type === 'study' ? 'selected' : ''}>Studium</option>
                            <option value="work" ${seg.type === 'work' ? 'selected' : ''}>Práce</option>
                        </select>
                    </div>

                    <div class="edit-group">
                        <label>Délka (roky)</label>
                        <input type="number" value="${seg.duration}" min="0" onchange="updateSegment(${index}, 'duration', this.value)">
                    </div>
                    
                    <div class="edit-group" style="${salaryStyle}">
                        <label>Hrubá mzda</label>
                        <input type="number" value="${seg.salary}" step="500" onchange="updateSegment(${index}, 'salary', this.value)">
                    </div>
                </div>
            </div>
        `;

        // Drag Events
        addDragEvents(row);
        list.appendChild(row);
    });
}

function expandSegment(event, index) {
    // Prevent event from bubbling if handled by button
    if (event.target.closest('.btn-remove')) return;

    const row = document.getElementById(`seg-row-${index}`);

    // Close other rows first
    document.querySelectorAll('.segment-row.expanded').forEach(r => {
        if (r !== row) r.classList.remove('expanded');
    });

    // Toggle current
    row.classList.toggle('expanded');
}

function removeSegment(event, index) {
    event.stopPropagation(); // Stop click from triggering expand
    segments.splice(index, 1);
    renderAll();
}

function updateSegment(index, field, value) {
    const val = field === 'type' ? value : parseFloat(value) || 0;
    segments[index][field] = val;

    if (field === 'type' && val !== 'work') {
        segments[index].salary = 0;
    }

    // If changing type, we need full re-render (to show/hide inputs)
    // We try to keep it open
    if (field === 'type') {
        renderList();
        const row = document.getElementById(`seg-row-${index}`);
        if (row) row.classList.add('expanded');
    } else {
        // Just update numbers, refresh header text manually or full render
        // Simplest is full render to keep sync, but might lose focus.
        // Let's do a soft update of UI stats and header text to avoid closing edit
        recalculateUI();
        refreshHeader(index);
    }
}

function refreshHeader(index) {
    // Updates the visible header text without re-rendering HTML (keeps inputs focused)
    const row = document.getElementById(`seg-row-${index}`);
    if (!row) return;

    const seg = segments[index];
    const infoSpan = row.querySelector('.header-info span:first-child');
    const salarySpan = row.querySelector('.header-salary');

    if (infoSpan) infoSpan.innerText = formatRoky(seg.duration);
    if (salarySpan) {
        salarySpan.innerText = seg.type === 'work' && seg.salary > 0
            ? `${seg.salary.toLocaleString()} Kč`
            : '';
    }
}

function recalculateUI() {
    const timeline = document.getElementById('timelineBar');
    timeline.innerHTML = '';

    let pensionAge = 65;
    const birthDateVal = document.getElementById('birthDate').value;
    if (birthDateVal) {
        const genderEl = document.querySelector('input[name="gender"]:checked');
        if (genderEl) {
            // Simple estimation for visual bar (backend handles exact calc)
            pensionAge = genderEl.value === 'M' ? 65 : 63;
        }
    }

    let totalDuration = 0;
    let workYears = 0;
    let substituteYears = 0;
    let weightedSalary = 0;

    // 1. Calculate Stats
    segments.forEach(s => {
        totalDuration += s.duration;
        if (s.type === 'work') {
            workYears += s.duration;
            weightedSalary += (s.salary * s.duration);
        }
        if (s.type === 'study') {
            substituteYears += s.duration;
        }
    });

    const avgSalary = workYears > 0 ? Math.round(weightedSalary / workYears) : 0;

    // 2. Render Timeline Bar
    segments.forEach((s, index) => {
        if (s.duration <= 0) return;

        const bar = document.createElement('div');
        bar.className = `timeline-segment type-${s.type}`;
        bar.onclick = (e) => {
            e.stopPropagation(); // Stop global click away
            focusSegment(index);
        };

        // WIDTH CALCULATION: Relative to Pension Age
        const widthPct = (s.duration / pensionAge) * 100;
        bar.style.width = `${widthPct}%`;

        if (widthPct > 8) {
            const durText = formatRoky(s.duration);
            let label = durText;
            if (widthPct > 15) {
                if (s.type === 'work') label = `HPP ${durText}`;
                if (s.type === 'study') label = `Studium ${durText}`;
                if (s.type === 'none') label = `Nic ${durText}`;
            }
            bar.innerText = label;
        }
        bar.title = `${formatRoky(s.duration)} (Klikněte pro úpravu)`;
        timeline.appendChild(bar);
    });

    // 3. Update Text Stats
    document.getElementById('statYears').innerText = formatRoky(workYears);
    document.getElementById('statSubstitute').innerText = formatRoky(substituteYears);
    document.getElementById('statSalary').innerText = avgSalary.toLocaleString('cs-CZ') + " Kč";

    // 4. Update Header Labels
    if (birthDateVal) {
        const year = new Date(birthDateVal).getFullYear();
        document.getElementById('labelBirth').innerText = `Narození (${year})`;
        document.getElementById('labelPension').innerText = `Důchod (cca ${formatRoky(pensionAge)})`;

        // Warning Check (vs Pension Age)
        const diff = totalDuration - pensionAge;
        const warningEl = document.getElementById('durationWarning');
        if (diff > 1) {
            warningEl.innerHTML = `Cesta je delší než čas do důchodu o <strong>${formatRoky(Math.round(diff))}</strong>.`;
            warningEl.classList.add('visible');
        } else {
            warningEl.classList.remove('visible');
        }
    }
}

// --- INTERACTION ---

function focusSegment(index) {
    const targetRow = document.getElementById(`seg-row-${index}`);
    if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Open
        if (!targetRow.classList.contains('expanded')) {
            expandSegment({ target: targetRow }, index);
        }

        // Highlight animation
        targetRow.classList.remove('highlighted');
        void targetRow.offsetWidth;
        targetRow.classList.add('highlighted');
    }
}

// --- DATA MANIPULATION ---

function addNewSegment() {
    segments.push({
        id: 'seg-' + Date.now(),
        type: 'work',
        duration: 5,
        salary: 45000
    });
    renderAll();

    // Auto-open new segment
    setTimeout(() => {
        focusSegment(segments.length - 1);
    }, 100);
}

// --- DRAG AND DROP LOGIC ---

function addDragEvents(row) {
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('dragleave', handleDragLeave);
    row.addEventListener('drop', handleDrop);
    row.addEventListener('dragend', handleDragEnd);
}

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');

    // Close edits
    document.querySelectorAll('.segment-row.expanded').forEach(r => r.classList.remove('expanded'));
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (this !== dragSrcEl) {
        this.classList.add('drag-over');
    }
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    this.classList.remove('drag-over');

    if (dragSrcEl !== this) {
        const srcIdx = parseInt(dragSrcEl.dataset.index);
        const targetIdx = parseInt(this.dataset.index);

        const item = segments[srcIdx];
        segments.splice(srcIdx, 1);
        segments.splice(targetIdx, 0, item);

        renderAll();
    }
    return false;
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.segment-row').forEach(row => row.classList.remove('drag-over'));
}

// --- API CALL ---

async function spocitejDuchod() {
    const birthDate = document.getElementById('birthDate').value;
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const children = document.getElementById('children').value;

    let totalWorkYears = 0;
    let totalSubstituteYears = 0;
    let weightedSalarySum = 0;

    segments.forEach(s => {
        if (s.type === 'work') {
            totalWorkYears += s.duration;
            weightedSalarySum += (s.salary * s.duration);
        } else if (s.type === 'study') {
            totalSubstituteYears += s.duration;
        }
    });

    const avgSalary = totalWorkYears > 0 ? Math.round(weightedSalarySum / totalWorkYears) : 0;

    document.getElementById('results').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');

    try {
        const params = new URLSearchParams({
            salary: avgSalary,
            years: totalWorkYears,
            birthDate,
            gender,
            children,
            substituteYears: totalSubstituteYears
        });

        const response = await fetch(`/api/calculate?${params.toString()}`);
        if (!response.ok) throw new Error("Chyba serveru.");

        const data = await response.json();
        renderResults(data.scenarios);

    } catch (e) {
        alert(e.message);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

function renderResults(scenarios) {
    const container = document.getElementById('results');
    container.innerHTML = '';
    container.classList.remove('hidden');

    scenarios.forEach(scenar => {
        const div = document.createElement('div');
        div.className = `card ${scenar.type}`;

        const money = scenar.amount > 0
            ? `${scenar.amount.toLocaleString('cs-CZ')} Kč`
            : 'Není možné';

        const desc = scenar.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        div.innerHTML = `
            <h3>${scenar.title}</h3>
            <div class="amount">${money}</div>
            <p class="desc">${desc}</p>
        `;
        container.appendChild(div);
    });
}