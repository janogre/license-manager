# UI Prototype Demo Guide

Dette er en guide for å kjøre og se UI-prototypen for Juniper License & Asset Manager.

## Hurtigstart

For å se prototypen må du installere frontend dependencies og starte dev-serveren:

```bash
cd frontend
npm install
npm run dev
```

Åpne deretter nettleseren på: http://localhost:5173

## Testbrukere

For å komme inn i prototypen, bruk disse credentials (frontend omgår autentisering i prototype-modus):
- Email: demo@example.com
- Password: demo (eller hva som helst)

## Hva kan du se?

### Dashboard
- **6 statistikk-kort** med real-time metrics
- **Asset status chart** med progress bars
- **Sync activity** timeline
- **Alert cards** for viktige varsler

### Assets Page
- **Fullstendig tabell** med 5 demo assets
- **Filtre og søk** - prøv å søke på "oslo" eller "srx"
- **Status badges** (Active, Spare, etc.)
- **Coverage status** - se hvilke assets mangler kontrakter
- **Add Asset modal** - klikk "Add Asset" for å se skjemaet
- **Stats cards** som viser totaler

### Licenses Page
- **4 stat cards** for licenses overview
- **Fullstendig lisensoversikt** med alle detaljer
- **Expiry warnings** - se licenses som utløper snart
- **License types** (Subscription, Perpetual, etc.)
- **Add License modal**

### Contracts Page (kommer...)
- Maintenance contracts oversikt
- Expiring contracts
- Coverage mapping

### Models Page (kommer...)
- Hardware model catalog
- EOL/EOS tracking
- Assets per model

### Reports Page (kommer...)
- Install Base Report
- Coverage Gap Report
- Cost Analysis

### Asset Detail Page (kommer...)
- Fullstendig asset info
- Tilknyttede licenses
- Contract history
- Audit trail

## Mock Data

Prototypen bruker realistic mock data:
- **5 assets** (MX240, EX4300, SRX345, MX204)
- **4 licenses** (Junos OS, ATP Cloud, etc.)
- **4 maintenance contracts** (Premium Care, Juniper Care)
- **5 hardware models**
- **Recent sync logs**

## Funksjonalitet som virker

✅ Navigation mellom sider
✅ Søk og filtrering
✅ Modaler for add/edit (UI only)
✅ Responsive design
✅ Mock data rendering
✅ All styling og komponenter

## Funksjonalitet som IKKE virker (prototype)

❌ API calls (bruker mock data)
❌ Faktisk lagring
❌ Autentisering (bypass i prototype)
❌ Observium sync
❌ Email notifications

## Navigasjon

Bruk sidebar til venstre:
- 📊 Dashboard
- 💽 Assets
- 🔑 Licenses
- 📄 Contracts
- 📦 Models
- 📈 Reports
- 🔄 Sync

## Neste Steg

For full funksjonalitet:
1. Start backend: `cd backend && npm run dev`
2. Sett opp PostgreSQL database
3. Kjør migrations: `npx prisma migrate dev`
4. Opprett admin user
5. Frontend vil automatisk koble til backend

## Tips for Demo

1. **Dashboard**: Se oversikten og alle varsler
2. **Assets**: Søk på "bergen" for å se firewall uten kontrakt
3. **Licenses**: Se at 2 licenses utløper snart
4. **Klikk "Add Asset"**: Se det komplette skjemaet
5. **Responsive**: Endre browser-størrelse for å se mobile view

## Skjermbilder kommer snart

Prototypen viser:
- Modern, clean design
- Tailwind CSS styling
- Lucide icons
- Professional color scheme
- Responsive layout
- Interactive elements

Nyt prototypen! 🎉
