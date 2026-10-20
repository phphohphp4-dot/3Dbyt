# Integrace do Openstudia

Tato složka obsahuje stránku pro stávající React/Vite aplikaci Openstudio.
Používá její skutečnou komponentu `Header`, takže přihlášení, účet i kredity
zůstávají pod správou Openstudia. 3D služba nedostává přihlašovací tokeny.

## Zapojení

Z kořene tohoto repozitáře:

```sh
python integrations/openstudio/apply.py /cesta/k/openstudio /cesta/k/zaloze
```

Skript přidá `/3d-prohlidky`, odkaz do navigace a patičky a tlačítko na
hlavní stránku. Před úpravou kontroluje očekávanou podobu souborů; cizí
změny nepřepisuje. Druhý argument je volitelný adresář zálohy.

Lokálně spusťte tuto službu na portu 3004 (`npm run tour:build` a
`npm run tour:serve`) a Openstudio na portu 8080. Otevřete
`http://127.0.0.1:8080/3d-prohlidky`.

## Shodná úvodní stránka

`SpatialHero.tsx` a `spatial-home.css` patří společně do
`src/components/home/` v Openstudiu. Komponenta používá stejné rozložení
a CSS jako místní 3D aplikace; vlastní hlavičku nevykresluje, aby zůstala
zachována navigace a účet Openstudia. Existující stránka `Index` ji vykresluje
pod komponentou `Header`. Obrázky očekává v `/images/showcase/`.

Při změně návrhu aktualizujte obě kopie. Nepřepisujte sekce znovu pomocí
přibližných Tailwind tříd: mění to šířky, ořez fotografie i barvy panelů.
Zdrojem rozložení je `components/ProjectExperience.tsx` a domovské styly
v `styles/experience.css`. Odkazy v hostitelské komponentě vedou na
`/3d-prohlidky`.

## Nasazení služby

Před sestavením Openstudia nastavte `VITE_3D_STUDIO_URL` na skutečnou
HTTPS adresu nasazené 3D služby. Bez ní produkční stránka zobrazí kontakt
na tým; nikdy neposílá klienta na localhost. Samotný push na GitHub
nepublikuje službu ani tuto změnu v produkčním Openstudiu.

3D služba potřebuje Node server, trvalé soukromé úložiště a HTTPS.
Lokální server v tomto repozitáři záměrně poslouchá jen na loopback.
Při nasazení ověřte limit 12 MB, zálohování podkladů, přístup týmu a
povolené domény pro vložení. Statický hosting bez API nestačí.

Vložení `?embed=openstudio` schová duplicitní hlavičku jen při
ověřeném původu nadřazené stránky: `https://www.openstudio.cz`,
`https://openstudio.cz` nebo místní port 8080. Mezi stránkami se posílá
jen oznámení o připravenosti. Chyba načtení nabízí opakování i samostatné
otevření služby. Úpravy modelů nadále vyžadují samostatné přihlášení týmu.
