# Prompt för Claude Code: Matscanner

Bygg en mobiloptimerad webbapp som låter användare scanna streckkoder på matvaror eller söka produkter för att se deras klimatpåverkan (Eco-Score) och näringsinnehåll.

## Tech Stack
- **Next.js 14** (App Router)
- **shadcn/ui** (för UI-komponenter)
- **Tailwind CSS** (inkluderat med shadcn)
- **html5-qrcode** (för streckkodsskanning via kamera)
- **Open Food Facts API** (för produktdata)
- **Vercel** (för deployment)

## Funktionalitet

### Core Features
1. **Streckkodsskanning** med kamera (använd html5-qrcode)
   - Starta/stoppa scanner
   - Visa kamera-feed
   - Automatisk produktsökning när kod hittas

2. **Textsökning** som fallback
   - Sök på produktnamn eller streckkod manuellt
   - Autocomplete om möjligt

3. **Produktvisning** med:
   - Produktnamn och bild
   - Eco-Score (A-E) med färgkodning:
     - A: Mörkgrön (#00AA00)
     - B: Ljusgrön (#55CC33)
     - C: Gul (#FFCC00)
     - D: Orange (#FF9933)
     - E: Röd (#FF0000)
   - CO2-utsläpp (om tillgängligt)
   - Nutri-Score (näringsmärkning A-E)
   - Ingredienser
   - Näringsinnehåll (protein, fett, kolhydrater per 100g)
   - Allergener
   - Varumärke

4. **Jämförelsefunktion**
   - Spara upp till 3 produkter
   - Visa side-by-side jämförelse av Eco-Score

## API Integration

### Open Food Facts API
- Base URL: `https://world.openfoodfacts.org/api/v2`
- Endpoints:
  - Sök med streckkod: `GET /product/{barcode}.json`
  - Sök med text: `GET /cgi/search.pl?search_terms={query}&json=1&page_size=20`
- Ingen API-nyckel krävs
- Rate limit: 100 req/min (generöst)

### Viktiga datafält från API:
```javascript
{
  product: {
    product_name_sv: "...",  // Svenskt namn (fallback till product_name)
    brands: "...",
    image_url: "...",
    ecoscore_grade: "a",     // a, b, c, d, e (eller null)
    ecoscore_score: 85,      // 0-100
    nutriscore_grade: "a",   // a, b, c, d, e
    nutriments: {
      energy_100g: "...",
      proteins_100g: "...",
      fat_100g: "...",
      carbohydrates_100g: "...",
      sugars_100g: "..."
    },
    ingredients_text_sv: "...",  // Fallback till ingredients_text
    allergens: "...",
    // Eco-data
    carbon_footprint_from_known_ingredients_product: "...",
    packaging: "..."
  }
}
```

## UI/UX Design

### Layout
- **Mobile-first design** (primärt vertikalt layout)
- Stor "Scanna"-knapp centrerad på startsidan
- Tydliga färgkoder för Eco-Score (A=grön, E=röd)
- Minimalistisk och ren design med shadcn/ui komponenter

### Komponenter (använd shadcn/ui där möjligt)
1. **Scanner-vy**
   - Fullscreen kamera-feed
   - Overlay med scannområde (guide-box)
   - shadcn **Button** för "Stoppa scanning"
   - shadcn **Alert** för feedbackmeddelanden: "Rikta kameran mot streckkoden"

2. **Sökkort** (om scanning inte fungerar)
   - shadcn **Input** för manuell sökning
   - shadcn **Button** för sökknapp

3. **Produktkort**
   - shadcn **Card** som wrapper
   - Hero-bild av produkten (om finns)
   - shadcn **Badge** för Eco-Score och Nutri-Score
   - shadcn **Tabs** för: Översikt / Näring / Ingredienser / Miljö
   - shadcn **Button** för "Jämför" och "Scanna ny produkt"

4. **Jämförelse-vy**
   - shadcn **Card** för varje produkt (2-3 kolumner)
   - Highlighta bästa valet (lägst Eco-Score)
   - shadcn **Separator** mellan produkter

5. **Loading States**
   - shadcn **Skeleton** för loading
   - shadcn **Spinner** vid API-calls

### Färgtema
- Primär: Grön (#10b981) för hållbarhet
- Bakgrund: Ljusgrå (#f9fafb)
- Text: Mörkgrå (#1f2937)
- Varningar: Röd (#ef4444) för dåliga Eco-Scores
- Använd shadcn/ui default theme som bas

## Tekniska Krav

### Kamera-access
- Använd `html5-qrcode` library
- Request kamera-permission
- Hantera fel om kamera nekas
- Visa tydligt felmeddelande: "Kamera-access krävs för scanning"

### Responsiv Design
- Fungera på både mobil och desktop
- På desktop: visa kamera i begränsad area
- På mobil: fullscreen kamera

### Error Handling
- Hantera produkt ej hittad (visa tydligt meddelande)
- Hantera API-fel (timeout, network error)
- Hantera produkter utan Eco-Score (visa "Ej betygsatt")
- Hantera saknad kamera-access

### Performance
- Lazy load produktbilder
- Debounce textsökning (500ms)
- Cache API-svar (localStorage) för snabbare repeat-access

## Projektstruktur
```
matscanner/
├── app/
│   ├── layout.tsx               # Root layout med metadata
│   ├── page.tsx                 # Home page (scanner/search)
│   ├── product/[barcode]/
│   │   └── page.tsx             # Produktvisning (dynamic route)
│   ├── compare/
│   │   └── page.tsx             # Jämförelsefunktion
│   └── globals.css              # Global styles + Tailwind
├── components/
│   ├── ui/                      # shadcn/ui komponenter (auto-genererade)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   ├── input.tsx
│   │   ├── alert.tsx
│   │   ├── skeleton.tsx
│   │   └── separator.tsx
│   ├── scanner.tsx              # Streckkodsskanner
│   ├── search-bar.tsx           # Textsökning
│   ├── product-card.tsx         # Produktvisning
│   ├── eco-score-badge.tsx      # Eco-Score badge
│   └── error-message.tsx        # Felhantering
├── lib/
│   ├── utils.ts                 # shadcn utils (cn function)
│   └── api/
│       └── openfoodfacts.ts     # API-integration
├── public/
│   └── (bilder)
├── components.json              # shadcn config
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## VIKTIGT: Projekt är redan setupat!

Next.js-projektet är redan klart med:
- ✅ Next.js 14 + TypeScript + Tailwind
- ✅ shadcn/ui installerat och konfigurerat
- ✅ Alla UI-komponenter redan tillagda: button, card, badge, tabs, input, alert, skeleton, separator
- ✅ GitHub repo kopplat till Vercel för auto-deploy

**Du behöver ENDAST:**
1. Installera html5-qrcode REDAN KLART MED pnpm
2. Bygga funktionaliteten
3. Testa att det bygger (npm run build)
4. Pusha till GitHub (Vercel deployas automatiskt)

## Steg-för-steg Implementation

1. **Installera html5-qrcode**
   ```bash
   npm install html5-qrcode
   ```

2. **Bygg API-service** (lib/api/openfoodfacts.ts)
2. **Bygg API-service** (lib/api/openfoodfacts.ts)
   - Async fetch-funktioner för barcode och search
   - TypeScript interfaces för Product data
   - Error handling
   - Data normalization
   
   ```typescript
   export interface Product {
     barcode: string;
     name: string;
     brand?: string;
     image_url?: string;
     ecoscore_grade?: 'a' | 'b' | 'c' | 'd' | 'e';
     ecoscore_score?: number;
     nutriscore_grade?: 'a' | 'b' | 'c' | 'd' | 'e';
     // ... mer
   }
   ```

3. **Bygg Scanner-komponent** (components/scanner.tsx)
   - "use client" directive (kräver browser APIs)
   - Använd Html5Qrcode från html5-qrcode
   - Start/stop scanning
   - useEffect för cleanup
   - Callback när barcode hittas

4. **Bygg Home page** (app/page.tsx)
   - "use client" för interaktivitet
   - State för scanner active/inactive
   - Alternativ mellan scanner och search
   - Redirect till /product/[barcode] när kod hittas

5. **Bygg Product page** (app/product/[barcode]/page.tsx)
   - Kan vara Server Component (fetch på server!)
   - Dynamic route med barcode param
   - Fetch product data
   - Visa med ProductCard component
   - shadcn Tabs för olika sektioner

6. **Bygg övriga komponenter**
   - ProductCard med shadcn Card, Badge, Tabs
   - EcoScoreBadge med färgkodning
   - SearchBar med shadcn Input och Button

7. **Metadata** (app/layout.tsx)
   ```typescript
   export const metadata: Metadata = {
     title: 'Matscanner - Klimatsmart matkoll',
     description: 'Scanna streckkoder för att se klimatpåverkan',
   }
   ```

8. **Styla med Tailwind**
    - Mobile-first approach
    - Responsiv design
    - Färgschema enligt spec
    - shadcn/ui hanterar det mesta

9. **Testa API-integration**
    - Test med känd streckkod: `7622300410049` (Nutella)
    - Test med svensk produkt: `7310240026702` (Oatly Havredryck)

10. **VIKTIGT: Testa att det bygger**
    ```bash
    npm run build
    ```
    - Måste lyckas innan push till GitHub
    - Fixa alla TypeScript errors
    - Fixa alla build errors

11. **Starta dev server med network access** (för lokal demo på telefon)
    ```bash
    npm run dev -- --hostname 0.0.0.0
    ```
    - Skriv ut lokal IP-adress: `http://192.168.x.x:3000`
    - Testa på telefon att det fungerar

12. **Pusha till GitHub**
    ```bash
    git add .
    git commit -m "Add matscanner functionality"
    git push origin main
    ```
    - Vercel deployas automatiskt
    - Check deployment status på Vercel dashboard

## Exempel på produktsökning
```javascript
// Fetch by barcode
const response = await fetch(
  `https://world.openfoodfacts.org/api/v2/product/7310240026702.json`
);
const data = await response.json();

if (data.status === 1) {
  const product = data.product;
  console.log(product.product_name_sv || product.product_name);
  console.log(product.ecoscore_grade); // 'a', 'b', 'c', 'd', 'e'
}
```

## Slutliga steg

### För lokal demo med telefon:

1. **Starta dev server**: 
   ```bash
   npm run dev -- --hostname 0.0.0.0
   ```
   
2. **Hitta din lokala IP**: 
   - Kolla i terminal-output
   - Eller kör `ipconfig` (Windows) / `ifconfig` (Mac/Linux)
   
3. **Skriv ut adressen**: 
   ```
   Öppna http://192.168.1.42:3000 på din telefon
   ```

4. **Test-streckkoder att använda**:
   - `7622300410049` - Nutella (bör ha data)
   - `7310240026702` - Oatly Havredryck
   - `7310532103500` - Arla Mjölk
   - `7310865740014` - Fazer Singoalla

### För deployment till Vercel (efter lokal demo):

**VIKTIGT:** GitHub repo och Vercel är redan kopplade innan demon!

1. **Testa att projektet bygger** (Claude ska göra detta):
   ```bash
   npm run build
   ```
   - Om build lyckas = redo för deployment ✅
   - Om build failar = fixa alla errors först ❌

2. **Pusha till GitHub** (Claude ska göra detta):
   ```bash
   git add .
   git commit -m "Add matscanner - klimatsmart matkoll"
   git push origin main
   ```

3. **Vercel bygger automatiskt!**
   - Vercel detekterar push på GitHub
   - Startar build automatiskt
   - ~30-90 sekunder senare: Live! 🎉
   - URL: `https://matscanner.vercel.app` (eller din custom domain)

4. **Dela URL med publiken**:
   - Check Vercel dashboard för production URL
   - Kopiera länken
   - "Nu kan ni alla testa på era egna telefoner!"

### Claude Code instruktioner för slutet:

Säg till Claude Code att avsluta med:
```
Nu ska vi deploya till Vercel:

1. Testa att projektet bygger:
   npm run build

2. Om build lyckas, pusha till GitHub:
   git add .
   git commit -m "Add matscanner functionality"
   git push origin main

3. Skriv ut: "✅ Pushat till GitHub! Vercel bygger nu automatiskt. 
   Öppna Vercel dashboard för att se deployment-status och få live URL."
```

## Viktiga detaljer
- Använd **"use client"** directive i komponenter som behöver browser APIs (scanner, useState, etc.)
- **Server Components** är default - använd för product pages där möjligt
- Använd **svenska språket** för all UI-text
- Hantera **både svenska och engelska produktnamn** från API
- Visa **"Ej betygsatt"** om ecoscore_grade saknas
- Lägg till **loading states** med shadcn Skeleton för alla API-calls
- Lägg till **haptic feedback** (vibration) när scanning lyckats (om möjligt i browser)
- **TypeScript** - använd proper interfaces för Product data
- **shadcn/ui** - följ deras patterns och använd cn() utility för klassnamn

## Success Criteria
✅ Kan scanna streckkoder med kamera
✅ Kan söka produkter manuellt
✅ Visar Eco-Score med korrekt färgkodning (shadcn Badge)
✅ Visar näringsinnehåll i shadcn Tabs
✅ Fungerar på mobil (testat via lokal IP)
✅ Hantera fel gracefully med shadcn Alert
✅ Responsiv design med Tailwind
✅ Dev server körs med --hostname 0.0.0.0 för telefon-access
✅ TypeScript utan errors
✅ Redo för Vercel deployment (bara köra `vercel`)

Bygg appen nu, testa den lokalt med telefon, och förbered för Vercel deployment!
