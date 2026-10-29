from __future__ import annotations

import json
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CITIES_PATH = ROOT / "src" / "data" / "cities.json"

QUERIES = [
    # Czech municipalities (obec v Česku)
    """
    SELECT ?name (MAX(?pop) AS ?population) WHERE {
      ?item wdt:P17 wd:Q213 .
      ?item wdt:P31 wd:Q515726 .
      ?item wdt:P1082 ?pop .
      ?item rdfs:label ?name .
      FILTER(LANG(?name) = "cs")
      FILTER(?pop >= 500)
    }
    GROUP BY ?name
    """,
    # Cities / towns again with broader subclass
    """
    SELECT ?name (MAX(?pop) AS ?population) WHERE {
      ?item wdt:P17 wd:Q213 .
      ?item wdt:P31/wdt:P279* wd:Q486972 .
      ?item wdt:P1082 ?pop .
      ?item rdfs:label ?name .
      FILTER(LANG(?name) = "cs")
      FILTER(?pop >= 1000)
    }
    GROUP BY ?name
    """,
]


def fetch(query: str) -> dict[str, int]:
    body = urllib.parse.urlencode({"query": query, "format": "json"}).encode("utf-8")
    req = urllib.request.Request(
        "https://query.wikidata.org/sparql",
        data=body,
        headers={
            "User-Agent": "CeskaGeografie/1.0 (educational browser game)",
            "Accept": "application/sparql-results+json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return {
        b["name"]["value"]: int(float(b["population"]["value"]))
        for b in payload["results"]["bindings"]
    }


def main() -> None:
    best: dict[str, int] = {}
    for i, query in enumerate(QUERIES):
        try:
            part = fetch(query)
            print(f"query {i}: {len(part)}")
            for name, pop in part.items():
                if name not in best or pop > best[name]:
                    best[name] = pop
        except Exception as exc:  # noqa: BLE001
            print(f"query {i} failed: {exc}")

    cities = json.loads(CITIES_PATH.read_text(encoding="utf-8"))
    filled = 0
    for city in cities:
        if city.get("pop") is not None:
            continue
        pop = best.get(city["name"])
        if pop is not None:
            city["pop"] = pop
            filled += 1

    # Hand-filled approximate/current values for stubborn mismatches (ČSÚ ~2024/2025)
    manual = {
        "Albrechtice": 3808,
        "Bechyně": 4900,
        "Budišov nad Budišovkou": 2800,
        "Cvikov": 4400,
        "Čelákovice": 12300,
        "Červený Kostelec": 8200,
        "Česká Kamenice": 5100,
        "Doksy": 5100,
        "Dolní Kounice": 2500,
        "Doubrava": 1200,
        "Duchcov": 8500,
        "Fulnek": 5500,
        "Hluboká nad Vltavou": 5500,
        "Holýšov": 5200,
        "Horní Bříza": 4200,
        "Hostivice": 9100,
        "Hronov": 6000,
        "Choceň": 8600,
        "Chodov": 13000,
        "Jablonné nad Orlicí": 3100,
        "Jáchymov": 2300,
        "Javorník": 2600,
        "Jemnice": 3900,
        "Jílové u Prahy": 5000,
        "Jirkov": 19000,
        "Jiříkov": 3500,
        "Kamenice nad Lipou": 3700,
        "Klášterec nad Ohří": 14000,
        "Klimkovice": 4500,
        "Kojetín": 5800,
        "Králův Dvůr": 10000,
        "Krupka": 12500,
        "Lázně Bohdaneč": 3500,
        "Ledeč nad Sázavou": 6200,
        "Lednice": 2300,
        "Letohrad": 6300,
        "Letovice": 6800,
        "Loket": 3000,
        "Lomnice nad Popelkou": 5500,
        "Mimoň": 6300,
        "Miroslav": 3000,
        "Modřice": 5500,
        "Nejdek": 7700,
        "Opočno": 3100,
        "Osek": 4500,
        "Petřvald": 7200,
        "Planá": 5200,
        "Počátky": 2500,
        "Police nad Metují": 4000,
        "Příbor": 8300,
        "Přibyslav": 4000,
        "Rájec-Jestřebí": 3700,
        "Roztoky": 9000,
        "Rychvald": 7700,
        "Sezemice": 4000,
        "Skuteč": 5000,
        "Strážnice": 5400,
        "Studénka": 9300,
        "Šenov": 6500,
        "Šluknov": 5600,
        "Štětí": 8500,
        "Toužim": 3500,
        "Třanovice": 1000,
        "Třemošná": 5000,
        "Třešť": 5700,
        "Týniště nad Orlicí": 6100,
        "Úpice": 5400,
        "Valtice": 3600,
        "Velká Bíteš": 5300,
        "Veselí nad Lužnicí": 6300,
        "Vidnava": 1200,
        "Zlaté Hory": 3700,
        "Žacléř": 3100,
    }

    for city in cities:
        if city.get("pop") is None and city["name"] in manual:
            city["pop"] = manual[city["name"]]
            filled += 1

    still = [c["name"] for c in cities if c.get("pop") is None]
    CITIES_PATH.write_text(
        json.dumps(cities, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    pops = [c["pop"] for c in cities if c.get("pop") is not None]
    print(f"filled={filled} still_missing={len(still)}")
    print(f"pop range {min(pops)} - {max(pops)}")
    if still:
        print(still)


if __name__ == "__main__":
    main()
