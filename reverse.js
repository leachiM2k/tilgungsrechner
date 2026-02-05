function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

function formatPercent(value) {
    return value.toFixed(2) + ' %';
}

function berechneRueckwaerts(event) {
    if (event) {
        event.preventDefault();
    }

    const jahr = parseInt(document.getElementById('jahr').value);
    const restschuldEnde = parseFloat(document.getElementById('restschuld-ende').value);
    const zinsenJahr = parseFloat(document.getElementById('zinsen-jahr').value);
    const tilgungJahr = parseFloat(document.getElementById('tilgung-jahr').value);
    const startdatumKreditInput = document.getElementById('startdatum-kredit').value;
    const zinsbindungJahre = parseInt(document.getElementById('zinsbindung-jahre').value);

    // Berechne Restschuld am Jahresanfang
    const restschuldAnfang = restschuldEnde + tilgungJahr;

    // Monatliche Rate (konstant über das Jahr)
    const monatlicheRate = (zinsenJahr + tilgungJahr) / 12;

    // Berechne Zinssatz mit Bisection-Methode
    const zinssatz = findeZinssatzExakt(restschuldAnfang, restschuldEnde, monatlicheRate, zinsenJahr);

    // Berechne ursprünglichen Darlehensbetrag, wenn Startdatum angegeben
    let urspruenglicherBetrag = null;
    let startdatumKredit = null;
    let monateGelaufen = null;

    if (startdatumKreditInput) {
        startdatumKredit = new Date(startdatumKreditInput);
        const jahresanfang = new Date(jahr, 0, 1); // 1. Januar des Jahres

        // Berechne Monate zwischen Kreditbeginn und Jahresanfang
        const monateZwischen = (jahresanfang.getFullYear() - startdatumKredit.getFullYear()) * 12
                              + (jahresanfang.getMonth() - startdatumKredit.getMonth());

        if (monateZwischen > 0) {
            monateGelaufen = monateZwischen;

            // Simuliere rückwärts vom Jahresanfang zum Kreditbeginn
            const monatszins = zinssatz / 100 / 12;
            let restschuld = restschuldAnfang;

            for (let i = 0; i < monateGelaufen; i++) {
                const zinsen = restschuld * monatszins;
                const tilgung = monatlicheRate - zinsen;
                restschuld = restschuld + tilgung; // Rückwärts: Schuld war höher
            }

            urspruenglicherBetrag = restschuld;

            // Berechne Restschuld beim Zinsbindungsende
            const monateZinsbindung = zinsbindungJahre * 12;
            let restschuldZinsbindung = urspruenglicherBetrag;

            for (let i = 0; i < monateZinsbindung; i++) {
                const zinsen = restschuldZinsbindung * monatszins;
                const tilgung = monatlicheRate - zinsen;
                restschuldZinsbindung -= tilgung;

                if (restschuldZinsbindung <= 0) {
                    restschuldZinsbindung = 0;
                    break;
                }
            }

            displayResultsReverse(jahr, zinssatz, restschuldAnfang, restschuldEnde, zinsenJahr, tilgungJahr,
                                  monatlicheRate, zinsbindungJahre, urspruenglicherBetrag, startdatumKredit,
                                  monateGelaufen, restschuldZinsbindung);
            updateURL();
            return;
        }
    }

    displayResultsReverse(jahr, zinssatz, restschuldAnfang, restschuldEnde, zinsenJahr, tilgungJahr,
                          monatlicheRate, zinsbindungJahre, null, null, null, null);
    updateURL();
}

function findeZinssatzExakt(restschuldAnfang, restschuldEnde, monatlicheRate, zinsenJahrSoll) {
    let zinsMin = 0.001; // 0.1%
    let zinsMax = 0.20; // 20%
    const epsilon = 0.000001; // Sehr hohe Genauigkeit

    // Bisection-Methode
    while (zinsMax - zinsMin > epsilon) {
        const zinsMitte = (zinsMin + zinsMax) / 2;
        const monatszins = zinsMitte / 12;

        // Simuliere ein Jahr vorwärts
        let restschuld = restschuldAnfang;
        let zinsenJahrBerechnet = 0;

        for (let monat = 0; monat < 12; monat++) {
            const zinsen = restschuld * monatszins;
            const tilgung = monatlicheRate - zinsen;
            zinsenJahrBerechnet += zinsen;
            restschuld -= tilgung;
        }

        // Vergleiche berechnete Zinsen mit tatsächlichen Zinsen
        if (Math.abs(zinsenJahrBerechnet - zinsenJahrSoll) < 0.01) {
            return zinsMitte * 100; // Konvertiere zu Prozent
        }

        if (zinsenJahrBerechnet > zinsenJahrSoll) {
            zinsMax = zinsMitte;
        } else {
            zinsMin = zinsMitte;
        }
    }

    return ((zinsMin + zinsMax) / 2) * 100; // Konvertiere zu Prozent
}

function displayResultsReverse(jahr, zinssatz, restschuldAnfang, restschuldEnde, zinsenJahr, tilgungJahr,
                               monatlicheRate, zinsbindungJahre, urspruenglicherBetrag, startdatumKredit, monateGelaufen, restschuldZinsbindung) {

    let summaryHTML = `
        <div class="summary-card">
            <h4>Berechneter Zinssatz p.a.</h4>
            <p style="color: #2e7d32; font-weight: 700;">${formatPercent(zinssatz)}</p>
        </div>
        <div class="summary-card">
            <h4>Monatliche Rate</h4>
            <p>${formatCurrency(monatlicheRate)}</p>
        </div>
    `;

    // Wenn Startdatum angegeben, zeige ursprünglichen Betrag
    if (urspruenglicherBetrag !== null) {
        const startdatumFormatiert = startdatumKredit.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const jahre = Math.floor(monateGelaufen / 12);
        const monate = monateGelaufen % 12;
        let laufzeitText = '';
        if (jahre > 0 && monate > 0) {
            laufzeitText = `${jahre} ${jahre === 1 ? 'Jahr' : 'Jahre'}, ${monate} ${monate === 1 ? 'Monat' : 'Monate'}`;
        } else if (jahre > 0) {
            laufzeitText = `${jahre} ${jahre === 1 ? 'Jahr' : 'Jahre'}`;
        } else {
            laufzeitText = `${monate} ${monate === 1 ? 'Monat' : 'Monate'}`;
        }

        summaryHTML += `
            <div class="summary-card" style="background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);">
                <h4>Urspr. Darlehensbetrag</h4>
                <p style="color: white; font-weight: 700;">${formatCurrency(urspruenglicherBetrag)}</p>
            </div>
            <div class="summary-card">
                <h4>Kreditbeginn</h4>
                <p>${startdatumFormatiert}</p>
            </div>
            <div class="summary-card">
                <h4>Laufzeit bis 01.01.${jahr}</h4>
                <p>${laufzeitText}</p>
            </div>
            <div class="summary-card" style="background: linear-gradient(135deg, #42a5f5 0%, #1976d2 100%);">
                <h4>Restschuld bei Zinsbindungsende</h4>
                <p style="color: white; font-weight: 700;">${formatCurrency(restschuldZinsbindung)}</p>
            </div>
        `;
    } else {
        summaryHTML += `
            <div class="summary-card">
                <h4>Restschuld am 01.01.${jahr}</h4>
                <p>${formatCurrency(restschuldAnfang)}</p>
            </div>
            <div class="summary-card">
                <h4>Zinsbindung</h4>
                <p>${zinsbindungJahre} ${zinsbindungJahre === 1 ? 'Jahr' : 'Jahre'}</p>
            </div>
        `;
    }

    document.getElementById('summary-reverse').innerHTML = summaryHTML;

    // Detaillierte Aufschlüsselung
    let explanationHTML = `
        <h4 style="color: #333; margin-top: 0; margin-bottom: 15px;">📊 Detaillierte Aufschlüsselung</h4>
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #e0e0e0; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
    `;

    // Wenn ursprünglicher Betrag berechnet wurde, zeige vollständige Timeline
    if (urspruenglicherBetrag !== null) {
        const gesamtTilgungBisJahr = urspruenglicherBetrag - restschuldAnfang;
        const gesamtZinsenBisJahr = (monatlicheRate * monateGelaufen) - gesamtTilgungBisJahr;

        // Berechne Datum des Zinsbindungsendes
        const zinsbindungsEndeDatum = new Date(startdatumKredit);
        zinsbindungsEndeDatum.setMonth(zinsbindungsEndeDatum.getMonth() + (zinsbindungJahre * 12));

        explanationHTML += `
                <tr style="border-bottom: 2px solid #66bb6a;">
                    <td style="padding: 12px 0; color: #2e7d32; font-weight: 600;">Urspr. Darlehensbetrag am ${startdatumKredit.toLocaleDateString('de-DE')}</td>
                    <td style="padding: 12px 0; text-align: right; color: #2e7d32; font-weight: 700; font-size: 1.1em;">${formatCurrency(urspruenglicherBetrag)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 0; color: #999; font-style: italic;">Gezahlte Zinsen bis 01.01.${jahr}</td>
                    <td style="padding: 12px 0; text-align: right; color: #999; font-style: italic;">${formatCurrency(gesamtZinsenBisJahr)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 0; color: #999; font-style: italic;">Geleistete Tilgung bis 01.01.${jahr}</td>
                    <td style="padding: 12px 0; text-align: right; color: #999; font-style: italic;">${formatCurrency(gesamtTilgungBisJahr)}</td>
                </tr>
                <tr style="border-bottom: 2px solid #42a5f5;">
                    <td style="padding: 12px 0; color: #1976d2; font-weight: 600;">Restschuld bei Zinsbindungsende (${zinsbindungsEndeDatum.toLocaleDateString('de-DE')})</td>
                    <td style="padding: 12px 0; text-align: right; color: #1976d2; font-weight: 700; font-size: 1.1em;">${formatCurrency(restschuldZinsbindung)}</td>
                </tr>
        `;
    }

    explanationHTML += `
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 0; color: #666;">Restschuld am 01.01.${jahr}</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600;">${formatCurrency(restschuldAnfang)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 0; color: #666;">Gezahlte Zinsen in ${jahr}</td>
                    <td style="padding: 12px 0; text-align: right; color: #e74c3c; font-weight: 600;">${formatCurrency(zinsenJahr)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding: 12px 0; color: #666;">Geleistete Tilgung in ${jahr}</td>
                    <td style="padding: 12px 0; text-align: right; color: #2e7d32; font-weight: 600;">${formatCurrency(tilgungJahr)}</td>
                </tr>
                <tr style="border-bottom: 2px solid #667eea;">
                    <td style="padding: 12px 0; color: #666;">Restschuld am 31.12.${jahr}</td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 600;">${formatCurrency(restschuldEnde)}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 0; color: #667eea; font-weight: 600;">Berechneter Zinssatz p.a.</td>
                    <td style="padding: 12px 0; text-align: right; color: #667eea; font-weight: 700; font-size: 1.2em;">${formatPercent(zinssatz)}</td>
                </tr>
            </table>
        </div>

        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #66bb6a;">
            <strong style="color: #2e7d32;">✓ Berechnung erfolgreich</strong>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 0.95em;">
    `;

    if (urspruenglicherBetrag !== null) {
        explanationHTML += `
                Der Zinssatz von <strong>${formatPercent(zinssatz)}</strong> wurde exakt aus den Jahreswerten berechnet.
                Mit dem angegebenen Kreditbeginn wurde der ursprüngliche Darlehensbetrag von <strong>${formatCurrency(urspruenglicherBetrag)}</strong> ermittelt.
        `;
    } else {
        explanationHTML += `
                Der Zinssatz wurde exakt aus den Jahreswerten berechnet. Die monatliche Rate von ${formatCurrency(monatlicheRate)}
                setzt sich aus variablen Zins- und Tilgungsanteilen zusammen, die zusammen konstant bleiben.
                <br><br>
                <em>Tipp: Geben Sie das Kreditbeginn-Datum ein, um den ursprünglichen Darlehensbetrag zu berechnen.</em>
        `;
    }

    explanationHTML += `
            </p>
        </div>
    `;

    document.getElementById('explanation').innerHTML = explanationHTML;
    document.getElementById('results-reverse').classList.remove('hidden');
    document.getElementById('results-reverse').scrollIntoView({ behavior: 'smooth' });
}

function updateURL() {
    const params = new URLSearchParams();

    // Basisdaten
    const jahr = document.getElementById('jahr').value;
    const restschuldEnde = document.getElementById('restschuld-ende').value;
    const zinsenJahr = document.getElementById('zinsen-jahr').value;
    const tilgungJahr = document.getElementById('tilgung-jahr').value;
    const startdatumKredit = document.getElementById('startdatum-kredit').value;
    const zinsbindungJahre = document.getElementById('zinsbindung-jahre').value;

    if (jahr) params.set('jahr', jahr);
    if (restschuldEnde) params.set('restschuld', restschuldEnde);
    if (zinsenJahr) params.set('zinsen', zinsenJahr);
    if (tilgungJahr) params.set('tilgung', tilgungJahr);
    if (startdatumKredit) params.set('start', startdatumKredit);
    if (zinsbindungJahre) params.set('zinsbindung', zinsbindungJahre);

    // URL aktualisieren ohne Seite neu zu laden
    const newURL = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newURL);
}

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);

    if (params.size === 0) {
        // Keine Parameter vorhanden, setze Standardwerte
        const aktuellesJahr = new Date().getFullYear();
        document.getElementById('jahr').value = aktuellesJahr - 1;
        return false;
    }

    // Lade alle Parameter
    if (params.has('jahr')) {
        document.getElementById('jahr').value = params.get('jahr');
    }
    if (params.has('restschuld')) {
        document.getElementById('restschuld-ende').value = params.get('restschuld');
    }
    if (params.has('zinsen')) {
        document.getElementById('zinsen-jahr').value = params.get('zinsen');
    }
    if (params.has('tilgung')) {
        document.getElementById('tilgung-jahr').value = params.get('tilgung');
    }
    if (params.has('start')) {
        document.getElementById('startdatum-kredit').value = params.get('start');
    }
    if (params.has('zinsbindung')) {
        document.getElementById('zinsbindung-jahre').value = params.get('zinsbindung');
    }

    return true;
}

// Event-Listener beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    const hasParams = loadFromURL();

    // Form-Submit-Handler
    document.getElementById('reverse-calculator-form').addEventListener('submit', berechneRueckwaerts);

    // Wenn Parameter vorhanden sind, führe automatisch die Berechnung durch
    if (hasParams) {
        berechneRueckwaerts();
    }
});
