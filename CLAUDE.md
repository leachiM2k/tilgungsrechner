# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a German-language loan/mortgage amortization calculator ("Baukredit Tilgungsrechner") that calculates detailed payment schedules for construction/home loans. The project consists of two implementations:

1. **Python CLI version** (`kredit_rechner.py`) - Generates amortization schedules using pandas
2. **Web version** - Interactive browser-based calculator hosted on GitHub Pages
   - `index.html` - Main HTML structure
   - `styles.css` - Styling
   - `script.js` - Calculation logic and UI interactions

Both implementations calculate the same core functionality: monthly payment breakdowns (interest, principal, extra payments) and remaining debt over the loan term.

**Note**: `tilgungsrechner.html` is the legacy single-file version and should not be modified. Use the split version (`index.html`, `styles.css`, `script.js`) for development.

## Running the Code

### Python Version

Run directly with Python 3:
```bash
python3 kredit_rechner.py
```

Requirements:
- `pandas`
- `python-dateutil`

Install dependencies:
```bash
pip install pandas python-dateutil
```

### Web Version

Open `index.html` in any modern web browser. No build process or server required - static HTML/CSS/JavaScript files.

For local testing:
```bash
# Simple HTTP server with Python
python3 -m http.server 8000
# Then open http://localhost:8000

# Or just open the file directly
open index.html
```

## Architecture

### Python Implementation (`kredit_rechner.py`)

**Core Function**: `erstelle_tilgungsplan()`
- Takes: start date, loan amount, interest rate, term length, monthly payment, and extra payments dictionary
- Returns: pandas DataFrame with complete amortization schedule
- Key calculation: Uses monthly interest rate (`zinssatz / 100 / 12`) to calculate interest and principal portions

**Configuration Section** (lines 88-102):
- Hardcoded values at bottom of file define specific loan scenario
- Extra payments defined as dict: `{month_number: amount}`
- Modify these constants to run different scenarios

**Output**:
- Console output showing first 15 months and end-of-term balance
- Optional Excel export (commented out by default)

### HTML/JavaScript Implementation (`index.html`, `styles.css`, `script.js`)

**Structure**:
- Modular structure with separated concerns
- `index.html` - DOM structure and markup
- `styles.css` - All styling, responsive layout, color scheme
- `script.js` - Calculation engine and DOM manipulation
- No external dependencies or frameworks

**Key Functions** (in `script.js`):
- `berechnen()`: Main calculation engine, mirrors Python logic
- `toggleMethode()`: Switches between "fixed monthly payment" and "fixed initial principal rate" calculation modes
- `addSondertilgung()`: Dynamic UI for adding extra payment entries
- `displayResults()`: Renders summary cards and detailed payment table
- `formatCurrency()`: German locale number formatting (1.234,56 €)
- `formatDate()`: MM.YYYY format for date display

**Calculation Modes**:
1. **Monatliche Rate** (Monthly Payment): User specifies exact monthly payment amount
2. **Anfängliche Tilgung** (Initial Principal Rate): User specifies initial principal percentage, monthly payment is calculated

**UI Features**:
- Summary cards show: loan amount, total interest, total principal, remaining debt at term end, total months
- Payment table highlights: extra payment months (yellow), end of interest lock period (blue)
- Responsive layout with gradient purple theme

## Key Domain Concepts

### German Financial Terms
- **Darlehensbetrag**: Loan amount / principal
- **Sollzins**: Nominal interest rate (annual)
- **Sollzinsbindung**: Interest rate lock period (years)
- **Tilgung**: Principal repayment
- **Sondertilgung**: Extra/additional payment (lump sum)
- **Restschuld**: Remaining debt

### Calculation Logic (Common to Both Implementations)

1. **Monthly Interest**: Annual rate ÷ 12
2. **Interest Portion**: Current debt × monthly interest rate
3. **Principal Portion**: Monthly payment - interest portion
4. **Extra Payments**: Applied in specific months, reduces debt immediately
5. **Loop Until Paid**: Continues until debt ≤ 0 (or max iteration limit)

The interest lock period ("Zinsbindung") marks when the fixed interest rate expires - important for refinancing decisions. This is highlighted in outputs but doesn't affect the calculation itself.

## Important Notes

- Both implementations use month-by-month iteration (not closed-form formulas)
- Extra payments are checked each month via dictionary lookup
- Final payment is adjusted automatically if remaining debt < regular payment
- Maximum iteration limits prevent infinite loops (1200 months in Python, 1000 in JavaScript)
- Date formatting: Python uses `strftime("%d.%m.%Y")`, JavaScript uses `MM.YYYY` format

## GitHub Pages Deployment

The web version is designed for GitHub Pages hosting:

1. Repository is already initialized with Git
2. `index.html` serves as the entry point (GitHub Pages default)
3. All assets (CSS, JS) use relative paths
4. No build process required - purely static files

To deploy:
```bash
# Create GitHub repository and push
git remote add origin https://github.com/[USERNAME]/kredit_rechner.git
git push -u origin main

# Enable GitHub Pages in repository settings:
# Settings → Pages → Source: main branch → Save
```

The site will be available at: `https://[USERNAME].github.io/kredit_rechner/`
