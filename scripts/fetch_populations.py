"""Fetch Czech city populations from Wikidata and merge into cities.json."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CITIES_PATH = ROOT / "src" / "data" / "cities.json"

QUERY = """
SELECT ?name (MAX(?pop) AS ?population) WHERE {
  ?item wdt:P17 wd:Q213 .
  ?item wdt:P31/wdt:P279* wd:Q515 .
  ?item wdt:P1082 ?pop .
  ?item rdfs:label ?name .
  FILTER(LANG(?name) = "cs")
}
GROUP BY ?name
ORDER BY DESC(?population)
"""


def fetch_wikidata() -> dict[str, int]:
    body = urllib.parse.urlencode(
        {"query": QUERY, "format": "json"}
    ).encode("utf-8")
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

    best: dict[str, int] = {}
    for binding in payload["results"]["bindings"]:
        name = binding["name"]["value"]
        pop = int(float(binding["population"]["value"]))
        best[name] = pop
    return best


def fetch_wikipedia_table() -> dict[str, int]:
    """Fallback: parse cs.wikipedia Seznam měst v Česku."""
    url = "https://cs.wikipedia.org/wiki/Seznam_m%C4%9Bst_v_%C4%8Cesku"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "CeskaGeografie/1.0 (educational browser game)"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        html = resp.read().decode("utf-8")

    # Rows look like: <td>...</td><td>City</td>...<td>12 345</td>
    # Use a simpler approach: find wikitable and extract name + population pairs
    best: dict[str, int] = {}

    # Match title links and nearby population numbers in table cells
    # Pattern from sortable wikitable rows
    row_re = re.compile(
        r"<tr[^>]*>\s*<td[^>]*>.*?</td>\s*<td[^>]*>\s*(?:<a[^>]*>)?([^<]+)(?:</a>)?.*?</td>"
        r"(?:.*?<td[^>]*>.*?</td>){1,6}"
        r".*?<td[^>]*>\s*([\d\s&nbsp;]+)\s*</td>",
        re.I | re.S,
    )

    for match in row_re.finditer(html):
        name = match.group(1).strip()
        raw = (
            match.group(2)
            .replace("&nbsp;", "")
            .replace("\xa0", "")
            .replace(" ", "")
            .strip()
        )
        if not raw.isdigit():
            continue
        pop = int(raw)
        if name and (name not in best or pop > best[name]):
            best[name] = pop

    return best


def main() -> None:
    best: dict[str, int] = {}
    try:
        best = fetch_wikidata()
        print(f"wikidata names={len(best)}")
    except Exception as exc:  # noqa: BLE001
        print(f"wikidata failed: {exc}")

    if len(best) < 100:
        wiki = fetch_wikipedia_table()
        print(f"wikipedia names={len(wiki)}")
        for name, pop in wiki.items():
            if name not in best or pop > best[name]:
                best[name] = pop

    cities = json.loads(CITIES_PATH.read_text(encoding="utf-8"))
    missing: list[str] = []
    updated = 0

    for city in cities:
        name = city["name"]
        pop = best.get(name)
        if pop is None:
            missing.append(name)
            # keep old pop if present
            if "pop" not in city:
                city["pop"] = None
        else:
            city["pop"] = pop
            updated += 1

    CITIES_PATH.write_text(
        json.dumps(cities, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"updated={updated} missing={len(missing)} total_lookup={len(best)}")
    for name in missing:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
