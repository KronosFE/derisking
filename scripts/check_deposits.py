#!/usr/bin/env python3
"""Daily deposit check for the Open Record trust center. Reads data/deposits.json, resolves each URL (DOIs through
doi.org), writes data/deposit_status.json: per deposit {ok, status, resolved, checked}. Rate-limit replies (429/403)
count as "unverified", never as failures. No secrets, no tokens."""
import json, ssl, time, urllib.request, urllib.error, datetime, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
CTX = ssl.create_default_context(); UA = {"User-Agent": "Mozilla/5.0 (KronosFE deposit-status; +https://www.kronosfusionenergy.com/open-science)", "Accept": "*/*"}
def probe(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30, context=CTX) as r:
                return r.status, r.geturl()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 2: time.sleep(5 * (attempt + 1)); continue
            return e.code, url
        except Exception as e:
            if attempt < 2: time.sleep(3); continue
            return -1, str(e)[:120]
    return -1, url
src = json.load(open(ROOT / "data/deposits.json", encoding="utf-8"))
now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
out = {"checked": now, "deposits": []}
for d in src["deposits"]:
    status, resolved = probe(d["url"]); time.sleep(0.8)
    verdict = "ok" if 200 <= status < 400 else "unverified" if status in (403, 429) else "fail"
    out["deposits"].append({"id": d["id"], "name": d["name"], "kind": d["kind"], "home": d["home"], "url": d["url"], "doi": d.get("doi"), "status": status, "resolved": resolved if verdict == "ok" else None, "verdict": verdict})
out["summary"] = {k: sum(1 for x in out["deposits"] if x["verdict"] == k) for k in ("ok", "unverified", "fail")}
json.dump(out, open(ROOT / "data/deposit_status.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(json.dumps(out["summary"]))
