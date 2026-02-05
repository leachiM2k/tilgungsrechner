let sondertilgungCounter = 0;

function toggleMethode() {
    const methode = document.querySelector('input[name="methode"]:checked').value;
    const rateGroup = document.getElementById('rate-group');
    const tilgungGroup = document.getElementById('tilgung-group');

    if (methode === 'rate') {
        rateGroup.classList.remove('hidden');
        tilgungGroup.classList.add('hidden');
    } else {
        rateGroup.classList.add('hidden');
        tilgungGroup.classList.remove('hidden');
    }
}

function addSondertilgung() {
    const container = document.getElementById('sondertilgungen');
    const div = document.createElement('div');
    div.className = 'sondertilgung-entry';
    div.innerHTML = `
        <input type="number" placeholder="Monat (z.B. 12)" min="1" step="1" data-id="${sondertilgungCounter}" class="st-monat">
        <input type="number" placeholder="Betrag (€)" step="0.01" data-id="${sondertilgungCounter}" class="st-betrag">
        <button class="btn-remove" onclick="removeSondertilgung(this)">✕</button>
    `;
    container.appendChild(div);
    sondertilgungCounter++;
}

function removeSondertilgung(btn) {
    btn.parentElement.remove();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}.${year}`;
}

function berechnen() {
    const startdatum = new Date(document.getElementById('startdatum').value);
    const darlehensbetrag = parseFloat(document.getElementById('darlehensbetrag').value);
    const sollzins = parseFloat(document.getElementById('sollzins').value) / 100;
    const zinsbindung = parseInt(document.getElementById('zinsbindung').value);
    const methode = document.querySelector('input[name="methode"]:checked').value;

    let monatlicheRate;

    if (methode === 'rate') {
        monatlicheRate = parseFloat(document.getElementById('monatlicherate').value);
        if (isNaN(monatlicheRate)) {
            alert('Bitte geben Sie die monatliche Rate ein.');
            return;
        }
    } else {
        const tilgungssatz = parseFloat(document.getElementById('tilgungssatz').value) / 100;
        if (isNaN(tilgungssatz)) {
            alert('Bitte geben Sie den anfänglichen Tilgungssatz ein.');
            return;
        }
        // Berechne monatliche Rate aus Tilgungssatz
        monatlicheRate = darlehensbetrag * (sollzins + tilgungssatz) / 12;
    }

    if (!document.getElementById('startdatum').value || isNaN(darlehensbetrag) || isNaN(sollzins) || isNaN(zinsbindung)) {
        alert('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
    }

    const sondertilgungen = {};
    const stMonat = document.querySelectorAll('.st-monat');
    const stBetrag = document.querySelectorAll('.st-betrag');

    for (let i = 0; i < stMonat.length; i++) {
        const monat = parseInt(stMonat[i].value);
        const betrag = parseFloat(stBetrag[i].value);
        if (!isNaN(monat) && !isNaN(betrag) && monat > 0 && betrag > 0) {
            sondertilgungen[monat] = betrag;
        }
    }

    let restschuld = darlehensbetrag;
    const monatszins = sollzins / 12;
    const zinsbindungMonat = zinsbindung * 12;

    const tilgungsplan = [];
    let gesamtZinsen = 0;
    let gesamtTilgung = 0;
    let gesamtSondertilgung = 0;
    let monat = 0;

    while (restschuld > 0.01) {
        monat++;
        const aktuellesDatum = new Date(startdatum);
        aktuellesDatum.setMonth(aktuellesDatum.getMonth() + monat - 1);

        const zinsen = restschuld * monatszins;
        let tilgung = monatlicheRate - zinsen;
        let sondertilgung = sondertilgungen[monat] || 0;

        if (tilgung + sondertilgung > restschuld) {
            tilgung = restschuld;
            sondertilgung = 0;
        }

        const rate = zinsen + tilgung;
        restschuld = restschuld - tilgung - sondertilgung;

        if (restschuld < 0) restschuld = 0;

        gesamtZinsen += zinsen;
        gesamtTilgung += tilgung;
        gesamtSondertilgung += sondertilgung;

        tilgungsplan.push({
            monat: monat,
            datum: formatDate(aktuellesDatum),
            rate: rate,
            zinsen: zinsen,
            tilgung: tilgung,
            sondertilgung: sondertilgung,
            restschuld: restschuld,
            istZinsbindungEnde: monat === zinsbindungMonat
        });

        if (monat > 1000) break;
    }

    displayResults(tilgungsplan, gesamtZinsen, gesamtTilgung, gesamtSondertilgung, darlehensbetrag, zinsbindungMonat);
}

function displayResults(plan, gesamtZinsen, gesamtTilgung, gesamtSondertilgung, darlehensbetrag, zinsbindungMonat) {
    const zinsbindungEnde = plan.find(p => p.monat === zinsbindungMonat);
    const restschuldZinsbindung = zinsbindungEnde ? zinsbindungEnde.restschuld : 0;

    const summaryHTML = `
        <div class="summary-card">
            <h4>Darlehensbetrag</h4>
            <p>${formatCurrency(darlehensbetrag)}</p>
        </div>
        <div class="summary-card">
            <h4>Gesamtzinsen</h4>
            <p>${formatCurrency(gesamtZinsen)}</p>
        </div>
        <div class="summary-card">
            <h4>Gesamttilgung</h4>
            <p>${formatCurrency(gesamtTilgung + gesamtSondertilgung)}</p>
        </div>
        <div class="summary-card">
            <h4>Restschuld bei Zinsbindungsende</h4>
            <p>${formatCurrency(restschuldZinsbindung)}</p>
        </div>
        <div class="summary-card">
            <h4>Laufzeit</h4>
            <p>${plan.length} Monate</p>
        </div>
    `;

    document.getElementById('summary').innerHTML = summaryHTML;

    const tbody = document.getElementById('tilgungsplan-body');
    tbody.innerHTML = '';

    plan.forEach(row => {
        const tr = document.createElement('tr');
        if (row.sondertilgung > 0) tr.className = 'highlight';
        if (row.istZinsbindungEnde) tr.className = 'zinsbindung-end';

        tr.innerHTML = `
            <td>${row.datum}</td>
            <td>${formatCurrency(row.rate)}</td>
            <td>${formatCurrency(row.zinsen)}</td>
            <td>${formatCurrency(row.tilgung)}</td>
            <td>${row.sondertilgung > 0 ? formatCurrency(row.sondertilgung) : '-'}</td>
            <td>${formatCurrency(row.restschuld)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// Setze das heutige Datum beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startdatum').valueAsDate = new Date();
});
