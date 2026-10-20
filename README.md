# Openstudio — 3D prohlídky z půdorysu

Světlý web ve vizuálním stylu Openstudia běží na `http://127.0.0.1:3004/`. Tlačítka **Nahrát půdorys** otevírají navazující klientskou stránku `/#nahrat-pudorys` ve stejném vzhledu. Tvorba a úpravy modelů jsou nyní pouze v soukromém studiu.


## Rychlé spuštění

Node.js 22.19+ a npm:

```sh
npm ci
npm run tour:build
npm run tour:serve
```

Otevřete `http://127.0.0.1:3004/`. Tento postup nepotřebuje Supabase ani
předchozí Next.js sestavení. Obsahuje hotovou ukázkovou GLB prohlídku.

## Propojení s Openstudiem

Stejné logo, světlá tyrkysová paleta a navigace. Ve stávající aplikaci
Openstudio je nová stránka `/3d-prohlidky` pod její skutečnou hlavičkou,
včetně původního ovládání účtu. Přenositelné změny a návod jsou v
[integrations/openstudio](integrations/openstudio/README.md).

GitHub obsahuje zdroj aplikace a potřebné ukázkové assety. Neobsahuje
hesla, `.env.local`, klientská zadání, lokální zálohy ani Blender pracovní
soubory. Publikování webu na internet je samostatný krok; tento server je
lokální a nasazené Openstudio potřebuje `VITE_3D_STUDIO_URL`.

Ověření:

```sh
npx tsc --noEmit
npm run floorplan:test
npm run tour:test
npm run intake:test
```

## Klientské podklady a soukromé studio

1. Klient vybere PDF/PNG/JPG/WebP do 12 MB.
2. Najde místo na mapě, zadá vnější šířku a délku domu, posune a natočí obdélníkový obrys a potvrdí umístění.
3. Přidá jméno, kontaktní e-mail a poznámku. Teprve konečné odeslání předá soubor a zadání serveru.
4. Tým otevře **Vstup do studia** v patičce. V **Přijaté podklady** najde originální soubor, rozměry, polohu a kontakt a otevře půdorys v editoru. Model se klientovi automaticky nevytváří a aplikace neposílá e-maily.

Heslo ověřuje server. Při prvním spuštění vytvoří náhodné heslo v `.private/byt3d/staff-access.txt`; hash je v `auth.json`. Lze místo toho nastavit `BYT3D_STAFF_PASSWORD` na serveru. Heslo není součástí klientského balíčku. Relace používá HttpOnly cookie a trvá nejvýše 8 hodin; restart serveru relace zruší. API zadání, původní soubory, úpravy prohlídky i standalone balíček studia vyžadují přihlášení.

Podklady jsou uložené na disku v `.private/byt3d/requests/<id>/`, mimo veřejně dostupné soubory. Alternativní trvalý adresář určuje `BYT3D_DATA_DIR`; při nasazení musí být zálohovaný a zachovaný mezi restartováními. Mapové dlaždice používají OpenStreetMap a vyhledávání Photon. Poskytovatele lze změnit přes `BYT3D_TILE_URL`, `BYT3D_TILE_ATTRIBUTION` a `BYT3D_GEOCODER_URL`. Vyhledávání běží jen po odeslání dotazu, server ho omezuje a ukládá do dočasné cache. Mapové podklady potřebují internet.

`npm run tour:serve` používá `node --use-system-ca`, aby HTTPS vyhledávání respektovalo důvěryhodné systémové certifikáty (ověřeno na místním Node 22.19). Server stále běží pouze lokálně; zpřístupnění klientům přes internet vyžaduje samostatné nasazení s HTTPS a trvalým úložištěm.

Ověření: `node scripts/test-intake.cjs` testuje autentizaci, oprávnění, validaci nahrávání, uložení podkladů a metrické rozměry obrysu.

## Generování z půdorysu v soukromém studiu

- Nahraný obrázek se zmenší na nejvýše 800 px a zpracuje v prohlížeči. Nikam se neodesílá.
- Detektor hledá vodorovné/svislé pásy šedého a tmavého zdiva; potlačuje barevné šrafování a tenké kóty. Výsledek je nutné ověřit v překryvu nad výkresem. Není to sémantická AI rekonstrukce; kóty, text a nábytek mohou vytvořit chybné čáry.
- Uživatel opraví stěny, zadá skutečnou šířku, výšku a tloušťku a přidá dveřní otvory. Výchozí šířka 10 m není automaticky zjištěné měřítko.
- Z ověřené geometrie vznikne 3D model, orbit pohled s řezem, chůze s kolizemi, barevné materiály, PNG snímek a binární GLB export.
- Podlaha je obdélníková obálka stěn. Okna a dveře lze přidat a upravit ručně. Více podlaží, nepravidelné obrysy, automatický nábytek a fotorealistické materiály zatím nejsou rekonstruovány. PDF je podporováno s výběrem jedné stránky.
- Projekty se ukládají do localStorage (nejvýše 5, stejný název aktualizuje uloženou verzi); přenos mezi zařízeními umožňuje validovaný JSON. Nejde o cloudové účty nebo veřejné sdílení.
- WebXR vstup se zpřístupní na podporovaném zařízení v zabezpečeném kontextu. Ovladače: spoušť teleportuje na viditelnou podlahu, levá páčka pohybuje, pravá otáčí po 30°. Ověření na fyzickém Questu zatím neproběhlo.

```sh
npm run tour:build
npm run tour:serve
npm run floorplan:test
```

Standalone server poslouchá pouze na `127.0.0.1:3004`. Veřejné nasazení s HTTPS je samostatný krok. Pro samotný generátor není potřeba Supabase ani API klíč. Původní ruční workflow, administrace a přiřazování GLB přes Supabase zůstávají v projektu; nastavení níže se týká těchto starších částí.

## Tech stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 + shadcn/ui (Base UI primitives)
- Supabase (Postgres, Storage, Auth)
- three.js + @react-three/fiber + @react-three/drei

## 1. Supabase setup

1. Vytvořte nový projekt na [supabase.com](https://supabase.com).
2. V **SQL Editor** spusťte obsah [`supabase/schema.sql`](./supabase/schema.sql) — vytvoří
   tabulku `projects` a zapne RLS (bez policies — veškerý přístup jde přes
   service-role klienta na serveru, prohlížeč se databáze nedotýká přímo).
3. V **Storage** vytvořte dva buckety, oba jako **public**:
   - `floor-plans`
   - `models`
4. V **Authentication → Users** manuálně vytvořte účet pro administrátora
   (e-mail + heslo, „Auto Confirm User“ zapnuté). Veřejná registrace do `/admin`
   neexistuje — admin účty se zakládají jen takto.
5. Zkopírujte `.env.local.example` do `.env.local` a vyplňte z
   **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (nikdy nepoužívat v klientském kódu)

## 2. Spuštění

```bash
npm install
npm run dev
```

- Úvodní stránka a lokální generátor: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (přesměruje na login)

## Jak to funguje

- **Starší komponenta `UploadForm`** předává půdorys server action `submitProject`
  (`app/actions/submit-project.ts`) uloží soubor do bucketu `floor-plans` a
  vytvoří řádek v `projects` se statusem `pending`. Klient je přesměrován na
  `/view/[slug]`.
- **`/view/[slug]`** zobrazuje stav projektu. Dokud `status !== 'completed'`,
  vidí klient informační obrazovku; jakmile admin nahraje model, zobrazí se
  3D viewer (`components/3d/Viewer3D.tsx`).
- **Admin** (`/admin`, chráněno Supabase Auth přes `proxy.ts`) vidí přehled
  projektů s filtrem podle stavu, v detailu projektu může stáhnout původní
  půdorys, nahrát `.glb`/`.gltf` model (uloží se do bucketu `models`, status
  se automaticky změní na `completed`) a měnit stav ručně.

## Poznámky k 3D vieweru

- `.glb` modely se načítají přes `useGLTF` s Draco dekompresí (dekodér se
  stahuje z Google CDN).
- Přepínač **Prohlídka / Procházka**: Orbit kamera vs. first-person chůze
  (`PointerLockControls` + WASD/šipky, `components/3d/FirstPersonRig.tsx`).
- Osvětlení: HDRI environment (`<Environment preset="apartment" />`) +
  směrové světlo s stíny — pro lepší výsledek doporučujeme peci (bake)
  světla přímo do materiálů modelu.

## Struktura

```
app/
  actions/submit-project.ts   veřejný upload (server action)
  admin/                       chráněný dashboard + detail projektu
  view/[slug]/                 veřejná 3D prohlídka
components/
  3d/                          Viewer3D, Model, FirstPersonRig
  upload/                      drag & drop formulář
  admin/                       tabulka projektů, login, upload modelu
lib/supabase/                  client.ts (browser), server.ts (SSR), admin.ts (service role)
supabase/schema.sql            DB schéma
types/project.ts               typy + stavy projektu
```

PDF půdorysy: místní PDF.js, výběr jedné stránky před rozpoznáním, limit 12 MB. Šifrované soubory vyžadují odemčenou kopii. Barevné šrafování je při detekci potlačeno; návrh os pravoúhlého zdiva nadále vyžaduje kontrolu, zejména u tenkých příček a otevřených dveří.

## Napojení a místnosti

- `Spojit napojení stěn` přitáhne blízké konce pravoúhlých stěn k L/T spojům a uzavře krátké kolineární mezery. Stejná oprava se provádí při přechodu do 3D. Úpravy jsou vratné přes Zpět; běžné dveřní mezery se nespojují.
- V části Místnosti stiskněte `Označit další místnost`, zvolte typ a klikněte do půdorysu. Značku lze přejmenovat, přesunout a odebrat. Ukládá se přes Uložit a přenáší v projektu JSON.
- Značky zatím představují polohu, název a účel místnosti, nikoli segmentované hranice nebo automaticky rozmístěný nábytek.

## Okna, dveře a krytí interiéru

- `Přidat okno` / `Přidat dveře`: klik na existující stěnu nebo do mezery mezi kolineárními úseky. V mezeře vznikne nový hostitelský úsek s otvorem. Odstranění otvoru tento úsek zacelí; pro návrat původní mezery použijte Zpět nebo odeberte hostitelskou stěnu.
- `Navrhnout otvory v mezerách` je geometrický návrh ke kontrole, ne rozpoznání symbolů. Dlouhé mezery uvnitř dispozice se nevyplňují. Vstupní dveře na obvodu je třeba odlišit od oken ručně; otvory v souvislých stěnách přidat ručně.
- Vyberte značku nebo položku v seznamu. Okna mají předvolby klasické, široké, vysoké a prosklení k podlaze, vlastní šířku/výšku/parapet. Rozměry musí vejít do hostitelské stěny a nesmí překrývat jiný otvor. Typ lze změnit mezi oknem a dveřmi.
- 3D obsahuje rámy, sklo, parapety, nadpraží, dveřní křídla a kliky. Okna blokují chůzi. Kliknutí na křídlo nebo spoušť VR jej otevře/zavře; stav během prohlídky je dočasný, výchozí poloha a závěsy se nastavují v editoru.
- Procházka vždy obsahuje strop. 3D přehled ho standardně skrývá, tlačítko `Strop / střecha` ukáže krytí. GLB export obsahuje celé krytí. Volitelná plochá nebo jednoduchá sedlová střecha je schematická nad obdélníkovým rozsahem modelu, nikoli odhad skutečné střechy z výkresu. Výška hřebene je upravitelná.
- Typ místnosti zahrnuje Dětský pokoj. Předlohy nábytku po místnostech a jejich automatické zpracování zatím implementované nejsou.

## Další kroky a aktualizace lokálního webu

- Nad modelem je přímá akce pro doplnění otvorů, úpravu oken/dveří, označení místností a vstup do interiéru. Doplnění otvorů zůstává vratným geometrickým návrhem ke kontrole.
- Uložit zachová projekt v localStorage a poslední uloženou verzi také v sessionStorage aktuální karty. Obnovení stránky otevře tento uložený projekt; neuložené změny tím nejsou automaticky zachovány.
- Statický build odkazuje na JS/CSS pomocí obsahového otisku, aby obnovení stránky načetlo aktuální verzi. Již otevřená stará stránka vyžaduje první ruční obnovení po uložení.
- Projekty mezi Chromem a prohlížečem Codexu nejsou synchronizované. Přenos je přes Projekt JSON, nikoli přes samotné Uložit.

## Přesné úpravy půdorysu

- Levý panel má stálé záložky Stěny / Okna a dveře / Místnosti / Vzhled. Kliknutí na otvor nebo místnost otevře odpovídající nástroje; obsah se posouvá samostatně pod navigací.
- Dveře i okna lze táhnout podél stěny. Bílé krajní úchyty mění šířku se zachováním protější hrany. Navazující kolineární úseky se při úpravě sjednotí a ostatní otvory zachovají polohu. Skutečné mezery se tímto nespojují.
- Šířka, výška a odsazení od označených bodů A/B přijímají desetinnou tečku i čárku. Potvrzení je Enterem nebo opuštěním pole. Tlačítka posouvají o 1 cm; na vybrané značce fungují také šipky (Shift = 10 cm).
- `Přesunout na jinou stěnu` zachová rozměry a čeká na kliknutí na cílovou stěnu. Překrývající se otvory se odmítají. Jedno Zpět vrátí celé tažení, Esc zruší jeho náhled.
- Při kreslení se začátek a konec přichytávají do vzdálenosti 20 cm ke stávajícím koncům a pravoúhlým napojením. Uvnitř otvoru se nový spoj nepřichytává. Přiblížení půdorysu 100–300 % usnadňuje výběr drobných částí.
