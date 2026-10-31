#!/usr/bin/env python3
"""Read official public CIDR feeds; prepare auditable data/rules, never call Vercel writes."""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import ipaddress
import json
import pathlib
import re
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
API_SCHEMA = "https://openapi.vercel.sh/"
FEEDS = (
    ("google-common", "Google common crawlers", "https://developers.google.com/static/crawling/ipranges/common-crawlers.json", r"(?:Googlebot(?:-(?:Image|Video|News))?|Google-InspectionTool)(?:/|[ ;)]|$)", "https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests"),
    ("google-verification", "Google Site Verifier", "https://developers.google.com/static/crawling/ipranges/user-triggered-fetchers-google.json", r"Google-Site-Verification(?:/|[ ;)]|$)", "https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers"),
    ("bingbot", "Bingbot", "https://www.bing.com/toolbox/bingbot.json", r"bingbot(?:/|[ ;)]|$)", "https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26"),
    ("openai-search", "OAI-SearchBot", "https://openai.com/searchbot.json", r"OAI-SearchBot(?:/|[ ;)]|$)", "https://developers.openai.com/api/docs/bots"),
    ("chatgpt-user", "ChatGPT-User", "https://openai.com/chatgpt-user.json", r"ChatGPT-User(?:/|[ ;)]|$)", "https://developers.openai.com/api/docs/bots"),
    ("perplexity-bot", "PerplexityBot", "https://www.perplexity.ai/perplexitybot.json", r"PerplexityBot(?:/|[ ;)]|$)", "https://docs.perplexity.ai/docs/resources/perplexity-crawlers"),
    ("perplexity-user", "Perplexity-User", "https://www.perplexity.ai/perplexity-user.json", r"Perplexity-User(?:/|[ ;)]|$)", "https://docs.perplexity.ai/docs/resources/perplexity-crawlers"),
)
APPROVED_URLS = {API_SCHEMA, *(row[2] for row in FEEDS)}
PUBLIC_CORE = (
    "about", "contact", "editorial-policy", "how-we-verify-movers", "movers-vs-brokers",
    "which-companies-receive-my-request", "review-methodology", "privacy", "terms",
    "get-quotes", "explore", "moving-cost-calculator", "complaints", "report-a-concern", "verify-a-mover",
)
PUBLIC_PATH_PATTERN = (
    r"^/(?:$|(?:" + "|".join(PUBLIC_CORE) + r")/?|moving-cost-calculator/method/?|"
    r"(?:movers|routes|services|questions|planning|moving-costs)(?:/[a-z0-9-]+)*/?|"
    r"robots\.txt|sitemap\.xml|sitemaps/[a-z]+(?:-[1-9][0-9]*)?\.xml|indexnow-key\.txt|"
    r"(?:media|brand|_next/static)/[a-z0-9_./()-]+|favicon\.ico)$"
)
UNSAFE_PATH_PATTERN = r"[%\\\x00-\x20]|(?:^|/)\.{1,2}(?:/|$)"

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("Official source redirected; review the destination before changing the allowlist")

def fetch_public(url: str, limit: int) -> tuple[bytes, dict]:
    if url not in APPROVED_URLS or not url.startswith("https://"):
        raise ValueError("Unapproved source URL")
    request = urllib.request.Request(url, headers={"User-Agent": "AmericanMovingChoice-CrawlerPolicy/1.0", "Accept": "application/json"})
    with urllib.request.build_opener(NoRedirect).open(request, timeout=20) as response:
        if response.status != 200 or response.url != url:
            raise ValueError("Official source did not return a direct HTTP 200")
        data = response.read(limit + 1)
        if len(data) > limit:
            raise ValueError("Official source exceeds its byte limit")
    return data, json.loads(data.decode("utf-8"))

def checked_prefixes(document: dict) -> list[str]:
    rows = document.get("prefixes")
    if not isinstance(rows, list) or not 1 <= len(rows) <= 2000:
        raise ValueError("Invalid or unexpectedly large CIDR list")
    result = set()
    for row in rows:
        if not isinstance(row, dict) or len(row) != 1:
            raise ValueError("Unexpected CIDR record")
        key, text = next(iter(row.items()))
        if key not in ("ipv4Prefix", "ipv6Prefix") or not isinstance(text, str) or "%" in text:
            raise ValueError("Invalid CIDR field")
        network = ipaddress.ip_network(text, strict=True)
        if str(network) != text or network.version != (4 if key == "ipv4Prefix" else 6) or network.prefixlen == 0 or not network.is_global or not network.network_address.is_global or not network.broadcast_address.is_global or network.is_multicast:
            raise ValueError("Non-canonical or non-public CIDR")
        result.add(text)
    return sorted(result, key=lambda value: (ipaddress.ip_network(value).version, int(ipaddress.ip_network(value).network_address), ipaddress.ip_network(value).prefixlen))

def schema_limits(schema: dict) -> dict:
    rule = schema["paths"]["/v1/security/firewall/config"]["put"]["requestBody"]["content"]["application/json"]["schema"]["properties"]["rules"]["items"]
    groups = rule["properties"]["conditionGroup"]
    conditions = groups["items"]["properties"]["conditions"]
    value = conditions["items"]["properties"]["value"]
    branches = value.get("anyOf", value.get("oneOf", []))
    values = next(branch["maxItems"] for branch in branches if branch.get("type") == "array")
    types = conditions["items"]["properties"]["type"]["enum"]
    operators = conditions["items"]["properties"]["op"]["enum"]
    if not {"environment", "method", "path", "raw_path", "ip_address", "user_agent", "geo_country"}.issubset(types) or not {"eq", "re", "inc", "ninc"}.issubset(operators):
        raise ValueError("Current Vercel schema does not support this policy")
    return {"valuesPerCondition": values, "groupsPerRule": groups["maxItems"], "conditionsPerGroup": conditions["maxItems"], "ruleSchema": rule}

def build_rules(bots: list[dict], limits: dict) -> list[dict]:
    size = min(75, limits["valuesPerCondition"])
    if size < 1:
        raise ValueError("Unsupported condition-value limit")
    groups = []
    for bot in bots:
        for offset in range(0, len(bot["prefixes"]), size):
            groups.append({"conditions": [
                {"type": "environment", "op": "eq", "value": "production"},
                {"type": "method", "op": "inc", "value": ["GET", "HEAD"]},
                {"type": "path", "op": "re", "value": PUBLIC_PATH_PATTERN},
                {"type": "raw_path", "op": "re", "value": UNSAFE_PATH_PATTERN, "neg": True},
                {"type": "user_agent", "op": "re", "value": bot["uaPattern"]},
                {"type": "ip_address", "op": "inc", "value": bot["prefixes"][offset:offset + size]},
            ]})
    if len(groups) > limits["groupsPerRule"] or any(len(group["conditions"]) > limits["conditionsPerGroup"] for group in groups):
        raise ValueError("Crawler exception no longer fits one rule; do not truncate ranges or deploy a partial policy")
    return [
        {"name": "AMC verified public crawler reads", "description": "Official per-bot CIDRs plus matching UA; public GET/HEAD only. Not a system bypass.", "active": True, "conditionGroup": groups, "action": {"mitigate": {"action": "bypass"}}},
        {"name": "AMC visitors USA and Pakistan", "description": "Production visitor IP countries must be US or PK; place after narrow crawler exceptions.", "active": True, "conditionGroup": [{"conditions": [{"type": "environment", "op": "eq", "value": "production"}, {"type": "geo_country", "op": "ninc", "value": ["US", "PK"]}]}], "action": {"mitigate": {"action": "deny"}}},
    ]

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, help="New directory inside work/security")
    parser.add_argument("--bundle", action="store_true", help="Also replace the audited public-data bundle used by the application")
    args = parser.parse_args()
    out = (ROOT / args.out).resolve()
    if not out.is_relative_to((ROOT / "work/security").resolve()) or out.exists():
        raise ValueError("Use a new output directory under work/security")
    fetched_at = dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")
    raw_schema, api = fetch_public(API_SCHEMA, 32_000_000)
    limits = schema_limits(api)
    bots, raw_feeds = [], []
    for identifier, name, url, ua_pattern, docs in FEEDS:
        raw, document = fetch_public(url, 2_000_000)
        prefixes = checked_prefixes(document)
        date = document.get("creationTime")
        if not isinstance(date, str):
            raise ValueError("Official source lacks its publication date")
        dt.datetime.fromisoformat(date.replace("Z", "+00:00"))
        bots.append({"id": identifier, "name": name, "sourceUrl": url, "documentationUrl": docs, "fetchedAt": fetched_at, "sourceCreationTime": date, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw), "count": len(prefixes), "ipv4Count": sum(ipaddress.ip_network(p).version == 4 for p in prefixes), "ipv6Count": sum(ipaddress.ip_network(p).version == 6 for p in prefixes), "uaPattern": r"(?:^|[\s;(])" + ua_pattern, "prefixes": prefixes})
        raw_feeds.append((identifier, raw))
    rules = build_rules(bots, limits)
    bundle = {"version": 1, "generatedAt": fetched_at, "scope": "Public read-only search crawlers; never private data or form submission", "publicPathPattern": PUBLIC_PATH_PATTERN, "unsafePathPattern": UNSAFE_PATH_PATTERN, "bots": bots}
    evidence = {"generatedAt": fetched_at, "sourceCount": len(bots), "prefixCount": sum(bot["count"] for bot in bots), "ruleCount": len(rules), "crawlerGroups": len(rules[0]["conditionGroup"]), "apiSchemaUrl": API_SCHEMA, "apiSchemaSha256": hashlib.sha256(raw_schema).hexdigest(), "apiSchemaBytes": len(raw_schema), "limits": limits, "caveats": ["Draft only: no platform API write or scheduled refresh occurs.", "Custom rule count fits published Hobby3/Pro40 limits; project entitlements and engine validation still need inspection.", "Rule drafts are for the public web project only; never apply crawler bypasses to the private app.", "Country ninc missing-value semantics must be checked before using the WAF draft; the application gate explicitly denies unknown countries.", "Bing/IndexNow ownership fetchers may need a separately reviewed public proof-file exception; no universal page or UA-only exception is generated.", "Raw source feeds are preserved; ranges are not widened or aggregated."]}
    out.mkdir(parents=True)
    (out / "sources").mkdir()
    for identifier, raw in raw_feeds:
        (out / "sources" / f"{identifier}.json").write_bytes(raw)
    for filename, value in (("crawler-ranges.json", bundle), ("vercel-waf-rules.json", rules), ("evidence.json", evidence)):
        (out / filename).write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.bundle:
        destination = ROOT / "packages/server/data/access/crawler-ranges.json"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(bundle, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"out": str(out), "sources": [{"id": bot["id"], "count": bot["count"]} for bot in bots], "prefixCount": evidence["prefixCount"], "crawlerGroups": evidence["crawlerGroups"], "limits": {key: value for key, value in limits.items() if key != "ruleSchema"}, "bundled": args.bundle}))

if __name__ == "__main__":
    main()
