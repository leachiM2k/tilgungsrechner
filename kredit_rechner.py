import pandas as pd
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

def erstelle_tilgungsplan(startdatum, darlehensbetrag, zinssatz, zinsbindung_jahre, rate, sondertilgungen):
    """
    Erstellt einen detaillierten Tilgungsplan.
    
    Parameter:
    - startdatum: datetime.date Objekt
    - darlehensbetrag: float (Restschuld zu Beginn)
    - zinssatz: float (Nominalzins p.a. in Prozent)
    - zinsbindung_jahre: int (Laufzeit der Zinsbindung)
    - rate: float (Monatliche Rate)
    - sondertilgungen: dict {Laufmonat: Betrag} (z.B. {12: 5000} für 5000€ im 12. Monat)
    """
    
    restschuld = darlehensbetrag
    aktuelles_datum = startdatum
    monatszins = zinssatz / 100 / 12
    
    daten = []
    
    # Maximale Laufzeit zur Sicherheit (damit die Schleife nicht endlos läuft)
    max_monate = zinsbindung_jahre * 12 + 1200 
    
    print(f"--- START DER BERECHNUNG ---")
    print(f"Kredit: {darlehensbetrag:,.2f} € | Zins: {zinssatz}% | Rate: {rate:,.2f} €")
    
    for monat in range(1, max_monate + 1):
        if restschuld <= 0:
            break
            
        # Zinsen für den aktuellen Monat berechnen
        zinsanteil = restschuld * monatszins
        
        # Tilgungsanteil berechnen
        # Wenn die Restschuld kleiner ist als die Rate, wird nur noch der Rest gezahlt
        tilgungsanteil = rate - zinsanteil
        
        # Anpassung für die letzte Rate
        if restschuld < tilgungsanteil:
            tilgungsanteil = restschuld
            aktuelle_rate = zinsanteil + tilgungsanteil
        else:
            aktuelle_rate = rate

        # Sondertilgung prüfen
        sondertilgung = sondertilgungen.get(monat, 0.0)
        
        # Wenn Sondertilgung höher als Restschuld
        if sondertilgung > (restschuld - tilgungsanteil):
             sondertilgung = restschuld - tilgungsanteil
        
        # Neue Restschuld berechnen
        restschuld_neu = restschuld - tilgungsanteil - sondertilgung
        
        # Daten speichern
        daten.append({
            "Laufmonat": monat,
            "Datum": aktuelles_datum.strftime("%d.%m.%Y"),
            "Rate": round(aktuelle_rate, 2),
            "Zinsen": round(zinsanteil, 2),
            "Tilgung (regulär)": round(tilgungsanteil, 2),
            "Sondertilgung": round(sondertilgung, 2),
            "Restschuld": round(restschuld_neu, 2)
        })
        
        # Datum um einen Monat erhöhen
        aktuelles_datum += relativedelta(months=1)
        restschuld = restschuld_neu

        # Prüfen ob Zinsbindung endet
        if monat == zinsbindung_jahre * 12:
            print(f"--- ENDE DER ZINSBINDUNG NACH {zinsbindung_jahre} JAHREN ---")
            print(f"Restschuld: {restschuld:,.2f} €")
            # Markierung im Datensatz (optional)
            daten[-1]["Bemerkung"] = "Ende Zinsbindung"
    
    # DataFrame erstellen
    df = pd.read_json(pd.io.json.dumps(daten)) # Workaround für saubere Typen oder direkt pd.DataFrame(daten)
    df = pd.DataFrame(daten)
    
    return df

# ==========================================
# KONFIGURATION (HIER WERTE EINTRAGEN)
# ==========================================

STARTDATUM = date(2026, 1, 30)
DARLEHENSBETRAG = 113861.60  # Euro
ZINSSATZ = 1.79              # Prozent p.a.
ZINSBINDUNG_JAHRE = 5        # Wie lange soll simuliert/geprüft werden?
MONATLICHE_RATE = 1471.17    # Euro

# Sondertilgungen: {Monat: Betrag}
# Beispiel: Im 12. Monat (Jan 2027) 10.000 Euro zahlen
SONDERTILGUNGEN = {
    12: 10000, 
    24: 10000,
    36: 10000
}

# ==========================================
# AUSFÜHRUNG
# ==========================================

if __name__ == "__main__":
    df_plan = erstelle_tilgungsplan(
        STARTDATUM, 
        DARLEHENSBETRAG, 
        ZINSSATZ, 
        ZINSBINDUNG_JAHRE, 
        MONATLICHE_RATE, 
        SONDERTILGUNGEN
    )

    # Ausgabe der ersten 15 Monate
    print("\n--- Auszug Tilgungsplan (erste Zeilen) ---")
    print(df_plan.head(15).to_string(index=False))

    # Ausgabe der Zeile am Ende der Zinsbindung
    ende_zinsbindung_idx = (ZINSBINDUNG_JAHRE * 12) - 1
    if len(df_plan) > ende_zinsbindung_idx:
        print("\n--- Stand am Ende der Zinsbindung ---")
        print(df_plan.iloc[ende_zinsbindung_idx].to_frame().T.to_string(index=False))

    # Optional: Als Excel speichern (Kommentar entfernen, wenn gewünscht)
    # df_plan.to_excel("tilgungsplan.xlsx", index=False)