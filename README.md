# Matscanner - Klimatsmart Matkoll

En mobiloptimerad webbapp för att scanna streckkoder på matvaror och se deras klimatpåverkan (Eco-Score) och näringsinnehåll.

## Funktioner

- **Streckkodsscanning**: Scanna produkter med kameran
- **Manuell sökning**: Sök produkter manuellt om scanner inte fungerar
- **Eco-Score**: Visar klimatpåverkan från A (bäst) till E (sämst)
- **Nutri-Score**: Näringsbetyg för produkter
- **Omfattande näringsdata**: Baserat på både Open Food Facts och Livsmedelsverkets databas
- **Svenska data**: Berikad näringsdata från Livsmedelsverket för svenska produkter

## API-integration

Appen använder två API:er för att ge användarna den bästa datan:

### 1. Open Food Facts API
- **Base URL**: `https://world.openfoodfacts.org/api/v3`
- **Användning**: Produktinformation, streckkodssökning, Eco-Score, bilder
- **Rate limits**: 100 förfrågningar/minut
- **Dokumentation**: https://openfoodfacts.github.io/openfoodfacts-server/api/

### 2. Livsmedelsverkets API
- **Base URL**: `https://dataportal.livsmedelsverket.se/livsmedel/api/v1`
- **Användning**: Svensk näringsdata (vitaminer, mineraler) för 2569 livsmedel
- **Licens**: Creative Commons Attribution 4.0
- **Dokumentation**: https://dataportal.livsmedelsverket.se/livsmedel/swagger/index.html
- **Status**: ✅ Fungerar (verifierad 2025-10-23)

**Fallback-logik**: Om Livsmedelsverkets API inte är tillgängligt eller om produkten inte hittas, använder appen enbart data från Open Food Facts.

### Datakällor i UI
Appen visar tydligt vilken datakälla som används:
- **"Svensk näringsdata från Livsmedelsverket"** - Kombinerad data från båda API:erna
- **"Data från Open Food Facts"** - Endast Open Food Facts

Svensk näringsdata visas med blå bakgrund i näringsfakta-tabben och inkluderar:
- Kalcium
- Järn
- Vitamin C
- Vitamin D

## Tech Stack

- **Framework**: Next.js 15.5.6 (med Turbopack)
- **UI**: shadcn/ui + Tailwind CSS
- **Streckkodsscanning**: Quagga (JavaScript barcode scanner)
- **Språk**: TypeScript

## Kom igång

Installera beroenden:

```bash
pnpm install
```

Starta utvecklingsservern:

```bash
pnpm dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

## Bygga för produktion

```bash
pnpm build
pnpm start
```

## Projektstruktur

```
matscanner/
├── app/                    # Next.js app router
│   ├── page.tsx           # Huvudsida (scanner + sökning)
│   ├── product/[barcode]/ # Produktsida
│   └── compare/           # Jämförelsesida
├── components/            # React-komponenter
│   ├── ui/               # shadcn/ui komponenter
│   ├── scanner.tsx       # Streckkodsscanner
│   ├── product-card.tsx  # Produktvisning
│   └── eco-score-badge.tsx
├── lib/
│   └── api/              # API-integrationer
│       ├── openfoodfacts.ts    # Open Food Facts
│       └── livsmedelsverket.ts # Livsmedelsverket
└── types/                # TypeScript-typer
```

## Licenser

- Appkod: MIT
- Open Food Facts data: Open Database License
- Livsmedelsverket data: Creative Commons Attribution 4.0

## Attributions

- Produktdata från [Open Food Facts](https://world.openfoodfacts.org/)
- Svensk näringsdata från [Livsmedelsverket](https://www.livsmedelsverket.se/)
