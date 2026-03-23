# Tariff Calculator — Backend Architecture

## Overview

This document defines the backend architecture for upgrading the Tariff and Landed Cost Calculator from a static React app with hardcoded rates to a full-stack application with a live rate database.

**Goal:** Rates update in one place (Supabase dashboard) and every user immediately gets current data. No redeployment required when tariff rates change.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (existing, GitHub Pages) | Already built |
| API | Node.js + Express | Familiar, same language as frontend |
| Database | PostgreSQL on Supabase | Free tier, built-in REST API, web UI for rate updates |
| API Hosting | Railway | Free tier, deploys from GitHub, auto-deploys on push |

---

## Repository Structure

```
tariff-calculator-api/
├── src/
│   ├── index.js              # Express app entry point
│   ├── routes/
│   │   ├── countries.js      # GET /api/countries
│   │   ├── chapters.js       # GET /api/chapters, GET /api/chapters/:code
│   │   ├── rates.js          # GET /api/rates/:country/:chapter
│   │   └── bulletin.js       # GET /api/bulletin
│   ├── db/
│   │   ├── client.js         # Supabase client setup
│   │   └── queries.js        # Reusable query functions
│   └── middleware/
│       └── cors.js           # CORS config allowing GitHub Pages origin
├── migrations/
│   ├── 001_create_countries.sql
│   ├── 002_create_hts_chapters.sql
│   ├── 003_create_tariff_rates.sql
│   └── 004_create_rate_bulletin.sql
├── seeds/
│   ├── seed_countries.js     # Initial country data
│   ├── seed_chapters.js      # All 99 HTS chapters
│   └── seed_rates.js         # Initial tariff rates
├── .env                      # SUPABASE_URL, SUPABASE_KEY, PORT
├── package.json
└── README.md
```

---

## Database Schema

### Table: `countries`

Stores all source countries with their current baseline tariff rates.

```sql
CREATE TABLE countries (
  id           SERIAL PRIMARY KEY,
  key          VARCHAR(20) UNIQUE NOT NULL,  -- e.g. "china", "vietnam"
  label        VARCHAR(100) NOT NULL,         -- e.g. "China"
  flag         VARCHAR(10),                   -- emoji flag
  region       VARCHAR(50),                   -- e.g. "Asia Pacific"
  baseline_rate DECIMAL(6,2) NOT NULL,        -- Section 122 rate e.g. 15.00
  usmca        BOOLEAN DEFAULT FALSE,
  s122_exempt  BOOLEAN DEFAULT FALSE,
  notes        TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

**Example rows:**
```
key          label    flag  region         baseline_rate  usmca   notes
china        China    🇨🇳   Asia Pacific   15.00          false   Section 122 15% baseline. Section 301 stacks on top...
canada       Canada   🇨🇦   North America  0.00           true    USMCA-qualifying goods duty free...
india        India    🇮🇳   Asia Pacific   15.00          false   Section 122 15% baseline. Interim deal framework...
```

---

### Table: `hts_chapters`

All 99 HTS chapters with typical MFN rate ranges and special tariff flags.

```sql
CREATE TABLE hts_chapters (
  id           SERIAL PRIMARY KEY,
  chapter      CHAR(2) UNIQUE NOT NULL,       -- e.g. "84", "62"
  section      VARCHAR(10),                   -- Roman numeral e.g. "XVI"
  description  VARCHAR(200) NOT NULL,
  mnf_low      DECIMAL(6,2) DEFAULT 0,        -- Typical MFN low end
  mnf_high     DECIMAL(6,2) DEFAULT 0,        -- Typical MFN high end
  s301_applies BOOLEAN DEFAULT FALSE,         -- Section 301 applies from China
  s301_rate    DECIMAL(6,2) DEFAULT 0,        -- Typical Section 301 rate
  s232_applies BOOLEAN DEFAULT FALSE,         -- Section 232 applies
  s232_rate    DECIMAL(6,2) DEFAULT 0,        -- Section 232 rate
  notes        TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

**Example rows:**
```
chapter  description                  mnf_low  mnf_high  s301_applies  s301_rate  s232_applies  s232_rate
84       Machinery, Boilers           0        6.00      true          25.00      false         0
72       Iron and Steel               0        6.50      true          25.00      true          50.00
62       Woven Apparel                0        28.60     true          7.50       false         0
```

---

### Table: `tariff_rates`

Country-specific rate overrides. When a country has a special rate for a specific chapter that differs from the defaults, it lives here.

```sql
CREATE TABLE tariff_rates (
  id            SERIAL PRIMARY KEY,
  country_key   VARCHAR(20) REFERENCES countries(key),
  chapter       CHAR(2) REFERENCES hts_chapters(chapter),
  s301_rate     DECIMAL(6,2),                 -- Override S301 rate for this country+chapter
  s232_rate     DECIMAL(6,2),                 -- Override S232 rate
  special_rate  DECIMAL(6,2),                 -- Any other special rate
  notes         TEXT,
  effective_date DATE,
  last_updated  TIMESTAMP DEFAULT NOW(),
  UNIQUE(country_key, chapter)
);
```

**Example rows:**
```
country_key  chapter  s301_rate  notes
china        85       50.00      Semiconductors 8541/8542 at 50%. EVs at 100%. Verify specific code.
china        87       100.00     EVs from China at 100% under Section 301
```

---

### Table: `rate_bulletin`

The rate bulletin that appears at the top of the tool. Update this table when the tariff landscape changes.

```sql
CREATE TABLE rate_bulletin (
  id           SERIAL PRIMARY KEY,
  version      VARCHAR(10) NOT NULL,          -- e.g. "v2.1"
  last_verified DATE NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rate_bulletin_alerts (
  id           SERIAL PRIMARY KEY,
  bulletin_id  INTEGER REFERENCES rate_bulletin(id),
  level        VARCHAR(10),                   -- "red", "amber", "green"
  title        VARCHAR(200),
  body         TEXT,
  sort_order   INTEGER DEFAULT 0
);

CREATE TABLE rate_bulletin_sources (
  id           SERIAL PRIMARY KEY,
  bulletin_id  INTEGER REFERENCES rate_bulletin(id),
  label        VARCHAR(100),
  url          VARCHAR(300)
);
```

---

## API Endpoints

### `GET /api/bulletin`

Returns the current active rate bulletin with alerts and sources.

**Response:**
```json
{
  "version": "v2.1",
  "lastVerified": "2026-03-19",
  "alerts": [
    {
      "level": "red",
      "title": "Section 122 Global Baseline: 15%",
      "body": "IEEPA tariffs struck down by Supreme Court..."
    }
  ],
  "sources": [
    { "label": "USITC HTS Schedule", "url": "https://hts.usitc.gov" }
  ]
}
```

---

### `GET /api/countries`

Returns all countries with current rates.

**Query params:**
- `region` — filter by region e.g. `?region=Asia+Pacific`

**Response:**
```json
[
  {
    "key": "china",
    "label": "China",
    "flag": "🇨🇳",
    "region": "Asia Pacific",
    "baselineRate": 15,
    "usmca": false,
    "s122Exempt": false,
    "notes": "Section 122 15% baseline..."
  }
]
```

---

### `GET /api/chapters`

Returns all 99 HTS chapters.

**Response:**
```json
[
  {
    "chapter": "84",
    "section": "XVI",
    "description": "Machinery, Boilers, Nuclear Reactors",
    "mnfLow": 0,
    "mnfHigh": 6,
    "s301Applies": true,
    "s301Rate": 25,
    "s232Applies": false,
    "s232Rate": 0,
    "notes": "Section 301 at 25%..."
  }
]
```

---

### `GET /api/chapters/:code`

Returns a single chapter by 2-digit code.

**Example:** `GET /api/chapters/84`

---

### `GET /api/rates/:countryKey/:chapter`

Returns the full rate stack for a specific country and chapter combination. Merges chapter defaults with any country-specific overrides.

**Example:** `GET /api/rates/china/85`

**Response:**
```json
{
  "country": "china",
  "chapter": "85",
  "mnfRate": 3.5,
  "baselineRate": 15,
  "s301Rate": 25,
  "s232Rate": 0,
  "specialRate": 0,
  "totalStackedRate": 43.5,
  "notes": "Section 301 at 25%. Consumer electronics some at 7.5%. Semiconductors at 50%.",
  "warnings": [
    "Semiconductors (HTS 8541/8542) are at 50% not 25%. Verify your specific 10-digit code."
  ]
}
```

---

## Frontend Integration

Once the API is live, the React frontend changes from using hardcoded constants to fetching from the API on load.

### Current (hardcoded):
```javascript
const COUNTRIES = {
  china: { l:"China", f:"🇨🇳", b:15, ... },
  // 37 more hardcoded entries
};
```

### Updated (API-driven):
```javascript
const [countries, setCountries] = useState([]);
const [chapters, setChapters]   = useState([]);
const [bulletin, setBulletin]   = useState(null);
const [loading, setLoading]     = useState(true);

useEffect(() => {
  const API = "https://your-api.railway.app";
  Promise.all([
    fetch(`${API}/api/countries`).then(r => r.json()),
    fetch(`${API}/api/chapters`).then(r => r.json()),
    fetch(`${API}/api/bulletin`).then(r => r.json()),
  ]).then(([countries, chapters, bulletin]) => {
    setCountries(countries);
    setChapters(chapters);
    setBulletin(bulletin);
    setLoading(false);
  });
}, []);
```

The rest of the component logic stays the same. The data just comes from the API instead of hardcoded constants.

---

## Rate Update Workflow

When tariff rates change (which they will):

1. Log into Supabase dashboard
2. Navigate to the relevant table (`countries`, `hts_chapters`, or `tariff_rates`)
3. Update the affected row directly in the UI
4. Update the `rate_bulletin` table with the new version, date, and alert text
5. Done. Every user who opens the tool gets the new rate immediately. No redeployment needed.

---

## Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=3000
ALLOWED_ORIGIN=https://matthewjflanagan.github.io
```

---

## Development Setup

```bash
# Clone the new API repo
git clone https://github.com/matthewjflanagan/tariff-calculator-api
cd tariff-calculator-api

# Install dependencies
npm install

# Install key packages
npm install express @supabase/supabase-js cors dotenv

# Create .env file with your Supabase credentials

# Run migrations in Supabase SQL editor (copy from migrations/ folder)

# Seed initial data
node seeds/seed_countries.js
node seeds/seed_chapters.js
node seeds/seed_rates.js

# Start development server
npm run dev
```

---

## Deployment to Railway

1. Push the API repo to GitHub
2. Go to railway.app and create a new project from GitHub repo
3. Add environment variables in Railway dashboard
4. Railway auto-deploys on every push to main
5. Update `ALLOWED_ORIGIN` in .env to match your GitHub Pages URL
6. Update the `API` base URL in the React frontend to your Railway URL
7. Redeploy the frontend with `npm run deploy`

---

## Future Enhancements

Once the core backend is live, these become straightforward additions:

- **HTS code search** — Full 10-digit HTS code lookup returning the exact MFN rate, not a chapter estimate
- **Saved calculations** — User accounts to save and compare landed cost calculations
- **Rate change alerts** — Email or webhook notifications when rates change for countries or chapters a user tracks
- **Comparison mode** — Side-by-side landed cost comparison across multiple countries in one view
- **Historical rates** — Track rate history over time to show how costs have changed
- **Freight rate integration** — Pull live ocean freight rates from Freightos or similar API

---

*Architecture document v1.0 · Matthew Flanagan, CPSM · March 2026*