async function spocitejDuchod() {
    const salary = document.getElementById('salary').value;
    const years = document.getElementById('years').value;
    const age = document.getElementById('age').value;
    
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');

    // Reset UI
    resultsDiv.innerHTML = '';
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');

    try {
        // Volání tvého Vercel Backend API
        const response = await fetch(`/api/calculate?salary=${salary}&years=${years}&age=${age}`);
        
        if (!response.ok) throw new Error("Chyba sítě");

        const data = await response.json();
        
        // Vykreslení karet
        data.scenarios.forEach(scenar => {
            const card = document.createElement('div');
            card.className = `card ${scenar.type}`;
            
            card.innerHTML = `
                <h3>${scenar.title}</h3>
                <div class="amount">${scenar.amount.toLocaleString('cs-CZ')} Kč</div>
                <p class="desc">${scenar.desc}</p>
            `;
            
            resultsDiv.appendChild(card);
        });

        resultsDiv.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        alert("Něco se pokazilo při výpočtu. Zkuste to prosím znovu.");
    } finally {
        loadingDiv.classList.add('hidden');
    }
}