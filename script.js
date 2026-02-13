let sondertilgungCounter = 0;

function toggleMethode() {
    const methode = document.querySelector('input[name="methode"]:checked').value;
    const rateGroup = document.getElementById('rate-group');
    const tilgungGroup = document.getElementById('tilgung-group');
    const monatlicherate = document.getElementById('monatlicherate');
    const tilgungssatz = document.getElementById('tilgungssatz');

    if (methode === 'rate') {
        rateGroup.classList.remove('hidden');
        tilgungGroup.classList.add('hidden');
        monatlicherate.required = true;
        tilgungssatz.required = false;
    } else {
        rateGroup.classList.add('hidden');
        tilgungGroup.classList.remove('hidden');
        monatlicherate.required = false;
        tilgungssatz.required = true;
    }
}

function addSondertilgung() {
    const container = document.getElementById('sondertilgungen');
    const div = document.createElement('div');
    div.className = 'sondertilgung-entry';
    div.innerHTML = `
        <div class="form-field">
            <label class="form-label">Monat</label>
            <input type="number" placeholder="12" min="1" step="1" data-id="${sondertilgungCounter}" class="st-monat form-input">
        </div>
        <div class="form-field">
            <label class="form-label">Betrag</label>
            <div class="input-with-unit">
                <input type="number" placeholder="5000" step="0.01" data-id="${sondertilgungCounter}" class="st-betrag form-input">
                <span class="input-unit">€</span>
            </div>
        </div>
        <button type="button" class="btn-remove" onclick="removeSondertilgung(this)">✕</button>
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

/**
 *
 * @returns {{
 *      startdatum: string,
 *      darlehensbetrag: number,
 *      sollzins: number,
 *      zinsbindung: number,
 *      monatlicherate: number,
 *      tilgungssatz: number
 * }}
 */
function getValues() {
    const fieldValueMapping = {
        'startdatum': { field: 'startdatum', type: 'date' },
        'darlehensbetrag': { field: 'darlehensbetrag', type: 'float' },
        'sollzins': { field: 'sollzins', type: 'float' },
        'zinsbindung': { field: 'zinsbindung', type: 'int' },
        'monatlicherate': { field: 'monatlicherate', type: 'float' },
        'tilgungssatz': { field: 'tilgungssatz', type: 'float' }
    };

    const values = {};
    for (const [fieldId, param] of Object.entries(fieldValueMapping)) {
        try {
            const element = document.getElementById(fieldId);
            if (element) {
                switch (param.type) {
                    case 'int':
                        values[param.field] = parseInt(element.value.replace(/,/g, '.'));
                        break;
                    case 'float':
                        values[param.field] = parseFloat(element.value.replace(/,/g, '.'));
                        break;
                    case 'date':
                        if (element.value) {
                            values[param.field] = new Date(element.value);
                        }
                        break;
                    default:
                        values[param.field] = element.value;
                }
            }
        } catch (e) {
            console.error(`Error parsing field ${fieldId}:`, e);
            values[param.field] = null;
        }
    }
    return values;
}

function berechnen(event) {
    if (event) {
        event.preventDefault();
    }

    const values = getValues();

    const startdatum = values.startdatum;
    const darlehensbetrag = values.darlehensbetrag;
    const sollzins = values.sollzins / 100;
    const zinsbindung = values.zinsbindung;
    const methode = document.querySelector('input[name="methode"]:checked').value;

    let monatlicheRate;

    if (methode === 'rate') {
        monatlicheRate = values.monatlicherate;
        if (isNaN(monatlicheRate)) {
            alert('Bitte geben Sie die monatliche Rate ein.');
            return;
        }
    } else {
        const tilgungssatz = values.tilgungssatz / 100;
        if (isNaN(tilgungssatz)) {
            alert('Bitte geben Sie den anfänglichen Tilgungssatz ein.');
            return;
        }
        // Berechne monatliche Rate aus Tilgungssatz
        monatlicheRate = darlehensbetrag * (sollzins + tilgungssatz) / 12;
    }

    if (!values.startdatum || isNaN(darlehensbetrag) || isNaN(sollzins) || isNaN(zinsbindung)) {
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
    updateURL();
}

function displayResults(plan, gesamtZinsen, gesamtTilgung, gesamtSondertilgung, darlehensbetrag, zinsbindungMonat) {
    const zinsbindungEnde = plan.find(p => p.monat === zinsbindungMonat);
    const restschuldZinsbindung = zinsbindungEnde ? zinsbindungEnde.restschuld : 0;

    const gesamtbetrag = gesamtZinsen + gesamtTilgung + gesamtSondertilgung;

    // Laufzeit in Jahren und Monaten
    const jahre = Math.floor(plan.length / 12);
    const monate = plan.length % 12;
    let laufzeitText = '';
    if (jahre > 0 && monate > 0) {
        laufzeitText = `${jahre} ${jahre === 1 ? 'Jahr' : 'Jahre'}, ${monate} ${monate === 1 ? 'Monat' : 'Monate'}`;
    } else if (jahre > 0) {
        laufzeitText = `${jahre} ${jahre === 1 ? 'Jahr' : 'Jahre'}`;
    } else {
        laufzeitText = `${monate} ${monate === 1 ? 'Monat' : 'Monate'}`;
    }

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
            <h4>Gesamtbetrag</h4>
            <p>${formatCurrency(gesamtbetrag)}</p>
        </div>
        <div class="summary-card">
            <h4>Restschuld Zinsbindungsende</h4>
            <p>${formatCurrency(restschuldZinsbindung)}</p>
        </div>
        <div class="summary-card">
            <h4>Laufzeit bis Rückzahlung</h4>
            <p>${laufzeitText}</p>
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

function updateURL() {
    const params = new URLSearchParams();

    // Basisdaten
    const startdatum = document.getElementById('startdatum').value;
    const darlehensbetrag = document.getElementById('darlehensbetrag').value;
    const sollzins = document.getElementById('sollzins').value;
    const zinsbindung = document.getElementById('zinsbindung').value;
    const methode = document.querySelector('input[name="methode"]:checked').value;

    if (startdatum) params.set('startdatum', startdatum);
    if (darlehensbetrag) params.set('darlehensbetrag', darlehensbetrag);
    if (sollzins) params.set('sollzins', sollzins);
    if (zinsbindung) params.set('zinsbindung', zinsbindung);
    params.set('methode', methode);

    // Methoden-spezifische Parameter
    if (methode === 'rate') {
        const monatlicherate = document.getElementById('monatlicherate').value;
        if (monatlicherate) params.set('monatlicherate', monatlicherate);
    } else {
        const tilgungssatz = document.getElementById('tilgungssatz').value;
        if (tilgungssatz) params.set('tilgungssatz', tilgungssatz);
    }

    // Sondertilgungen
    const stMonat = document.querySelectorAll('.st-monat');
    const stBetrag = document.querySelectorAll('.st-betrag');
    const sondertilgungen = [];

    for (let i = 0; i < stMonat.length; i++) {
        const monat = parseInt(stMonat[i].value);
        const betrag = parseFloat(stBetrag[i].value);
        if (!isNaN(monat) && !isNaN(betrag) && monat > 0 && betrag > 0) {
            sondertilgungen.push(`${monat}:${betrag}`);
        }
    }

    if (sondertilgungen.length > 0) {
        params.set('st', sondertilgungen.join(','));
    }

    // URL aktualisieren ohne Seite neu zu laden
    const newURL = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newURL);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.size === 0) {
        // Keine Parameter vorhanden, setze Standard-Startdatum
        document.getElementById('startdatum').valueAsDate = new Date();
        return false;
    }

    // Basisdaten laden
    if (params.has('startdatum')) {
        document.getElementById('startdatum').value = params.get('startdatum');
    }
    if (params.has('darlehensbetrag')) {
        document.getElementById('darlehensbetrag').value = params.get('darlehensbetrag');
    }
    if (params.has('sollzins')) {
        document.getElementById('sollzins').value = params.get('sollzins');
    }
    if (params.has('zinsbindung')) {
        document.getElementById('zinsbindung').value = params.get('zinsbindung');
    }

    // Methode laden
    if (params.has('methode')) {
        const methode = params.get('methode');
        document.querySelector(`input[name="methode"][value="${methode}"]`).checked = true;
        toggleMethode();

        if (methode === 'rate' && params.has('monatlicherate')) {
            document.getElementById('monatlicherate').value = params.get('monatlicherate');
        } else if (methode === 'tilgung' && params.has('tilgungssatz')) {
            document.getElementById('tilgungssatz').value = params.get('tilgungssatz');
        }
    }

    // Sondertilgungen laden
    if (params.has('st')) {
        const sondertilgungen = params.get('st').split(',');
        sondertilgungen.forEach(st => {
            const [monat, betrag] = st.split(':');
            if (monat && betrag) {
                addSondertilgung();
                const entries = document.querySelectorAll('.sondertilgung-entry');
                const lastEntry = entries[entries.length - 1];
                lastEntry.querySelector('.st-monat').value = monat;
                lastEntry.querySelector('.st-betrag').value = betrag;
            }
        });
    }

    return true;
}

// Setze das heutige Datum beim Laden der Seite und lade URL-Parameter
document.addEventListener('DOMContentLoaded', function() {
    const hasParams = loadFromURL();

    // Form-Submit-Handler
    document.getElementById('calculator-form').addEventListener('submit', berechnen);

    // Wenn Parameter vorhanden sind, führe automatisch die Berechnung durch
    if (hasParams) {
        berechnen();
    }

    // setze required-Attribute basierend auf der gewählten Methode
    toggleMethode();
});
