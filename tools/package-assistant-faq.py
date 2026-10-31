#!/usr/bin/env python3
"""Verify both public FAQ formats and package two independent, mapped deliveries.

Usage: python tools/package-assistant-faq.py --source <export-dir> --out <new-dir>
The input is tools/export-assistant-faq.ts output. No raw snapshot, credentials,
source code, browser state, or unrelated files are copied into either archive.
"""

from __future__ import annotations

import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import sys
from typing import Any
from urllib.parse import urlsplit
import zipfile
from datetime import datetime, timezone


BUSINESS = "American Moving Choice"
MAX_MANIFEST_BYTES = 128_000_000
MAX_PAGE_BYTES = 2_000_000
SHA256 = re.compile(r"^[0-9a-f]{64}$")
PRIVATE_IDENTITY = re.compile(r"^/(?:my-request|admin|portal|companies|directory|moving-routes)(?:/|$)")
SECRET_LIKE = re.compile(r"\b(?:sk-ant-[A-Za-z0-9_-]{12,}|sb_secret_[A-Za-z0-9_-]{12,}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{24,})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?://[^\s:/]+:[^\s@]+@")


class VerificationError(ValueError):
    """A source export failed a publication or file-boundary check."""


def require(condition: bool, message: str) -> None:
    if not condition:
        raise VerificationError(message)


def unique_json_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        require(key not in result, f"Duplicate JSON property: {key}")
        result[key] = value
    return result


def parse_json(raw: bytes, label: str) -> Any:
    try:
        return json.loads(raw.decode("utf-8-sig"), object_pairs_hook=unique_json_object)
    except (UnicodeError, json.JSONDecodeError) as error:
        raise VerificationError(f"{label} is not valid UTF-8 JSON") from error


def source_file(source: Path, relative: Any, expected_format: str | None = None) -> tuple[Path, str]:
    require(isinstance(relative, str) and bool(relative), "A source file path is missing")
    require("\\" not in relative and ":" not in relative and "\x00" not in relative,
            "Source paths must be relative POSIX paths")
    path = PurePosixPath(relative)
    require(not path.is_absolute() and all(part not in (".", "..") for part in path.parts),
            "Source path traversal is forbidden")
    require(path.as_posix() == relative, "Source paths must be normalized")
    if expected_format == "html":
        require(bool(re.fullmatch(r"html/[0-9]{5,}\.html", relative)), "Unexpected HTML artifact path")
    elif expected_format == "jsonld":
        require(bool(re.fullmatch(r"jsonld/[0-9]{5,}\.json", relative)), "Unexpected JSON-LD artifact path")
    resolved = (source / path).resolve(strict=True)
    require(resolved.is_relative_to(source), "Source artifact resolves outside its export directory")
    require(resolved == source / path, "Symlinked source artifacts are forbidden")
    require(resolved.is_file(), "Source artifact is not a regular file")
    require(resolved.stat().st_size <= (MAX_MANIFEST_BYTES if relative == "manifest.json" else MAX_PAGE_BYTES),
            f"Source artifact exceeds its bounded size: {relative}")
    return resolved, relative


class VisibleFaqParser(HTMLParser):
    """Accept exactly alternating, plain h3/p pairs, decoding HTML entities once."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.active: str | None = None
        self.text: list[str] = []
        self.elements: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        expected = "h3" if len(self.elements) % 2 == 0 else "p"
        require(self.active is None and tag == expected and not attrs,
                "Visible HTML must contain only alternating plain h3/p pairs")
        self.active = tag
        self.text = []

    def handle_endtag(self, tag: str) -> None:
        require(self.active == tag, "Visible HTML contains an unmatched closing tag")
        self.elements.append((tag, "".join(self.text)))
        self.active = None
        self.text = []

    def handle_data(self, data: str) -> None:
        if self.active is not None:
            self.text.append(data)
        else:
            require(not data.strip(), "Visible HTML contains text outside an h3/p pair")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        raise VerificationError("Self-closing tags are not part of the visible FAQ format")

    def handle_comment(self, data: str) -> None:
        raise VerificationError("HTML comments are not part of the visible FAQ format")

    def handle_decl(self, decl: str) -> None:
        raise VerificationError("The visible FAQ artifact must be an h3/p snippet")

    def unknown_decl(self, data: str) -> None:
        raise VerificationError("Unknown HTML declarations are forbidden")

    def handle_pi(self, data: str) -> None:
        raise VerificationError("Processing instructions are not part of the visible FAQ format")

    def items(self) -> list[dict[str, str]]:
        require(self.active is None and len(self.elements) % 2 == 0,
                "Visible HTML contains an unfinished question/answer pair")
        return [{"question": self.elements[index][1], "answer": self.elements[index + 1][1]}
                for index in range(0, len(self.elements), 2)]


def check_text_items(items: Any, label: str) -> None:
    require(isinstance(items, list) and 4 <= len(items) <= 5, f"{label}: expected four or five questions")
    questions: set[str] = set()
    answers: set[str] = set()
    for item in items:
        require(isinstance(item, dict) and set(item) == {"question", "answer"}, f"{label}: invalid FAQ item")
        question, answer = item["question"], item["answer"]
        require(isinstance(question, str) and isinstance(answer, str), f"{label}: FAQ values must be strings")
        require(question.strip().endswith("?"), f"{label}: a question lacks its question mark")
        require(40 <= len(answer.strip().split()) <= 80, f"{label}: answer is outside 40–80 words")
        require(BUSINESS in answer, f"{label}: answer does not name the business")
        require(not SECRET_LIKE.search(question + answer), f"{label}: FAQ contains secret-like material")
        require(question.lower() not in questions and answer.lower() not in answers,
                f"{label}: repeated question or answer")
        questions.add(question.lower())
        answers.add(answer.lower())
        require(not re.search(r"</?[a-z][^>]*>|\]\([^)]*\)|\*\*", question + answer, re.IGNORECASE),
                f"{label}: FAQ contains non-plain-text markup")
        require(not re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", question + answer),
                f"{label}: FAQ contains invisible control characters")


def validate_url(value: Any) -> str:
    require(isinstance(value, str) and value.startswith("/") and not value.startswith("//"),
            "A public page URL must be an absolute site path")
    parsed = urlsplit(value)
    require(not parsed.scheme and not parsed.netloc and not parsed.fragment and "\\" not in value,
            "A public page URL has an invalid origin or fragment")
    require(all(part not in (".", "..") for part in PurePosixPath(parsed.path).parts),
            "A public page URL contains traversal")
    require(not PRIVATE_IDENTITY.search(parsed.path), "Private or retired page identity cannot enter the delivery")
    return value


def verify_export(source: Path) -> tuple[dict[str, Any], list[dict[str, Any]], bytes]:
    manifest_path, _ = source_file(source, "manifest.json")
    manifest_bytes = manifest_path.read_bytes()
    manifest = parse_json(manifest_bytes, "Export manifest")
    require(isinstance(manifest, dict), "Export manifest must be an object")
    pages = manifest.get("pages")
    require(isinstance(pages, list) and bool(pages), "Export manifest has no pages")
    require(type(manifest.get("exportedPages")) is int and manifest["exportedPages"] == len(pages),
            "Declared page total does not match the manifest")
    require(manifest.get("held") == [], "Source export still has held or failed pages")
    require(isinstance(manifest.get("exportedAt"), str), "Export timestamp is missing")
    try:
        datetime.fromisoformat(manifest["exportedAt"].replace("Z", "+00:00"))
    except ValueError as error:
        raise VerificationError("Export timestamp is invalid") from error
    require(isinstance(manifest.get("sourceSnapshotSha256"), str) and
            bool(SHA256.fullmatch(manifest["sourceSnapshotSha256"])), "Source snapshot SHA-256 is missing")
    require(type(manifest.get("sourceGuideCount")) is int and
            0 < manifest["sourceGuideCount"] <= len(pages), "Source guide count is invalid")
    origin = manifest.get("webUrl")
    require(isinstance(origin, str), "Public web origin is missing")
    require(not re.search(r"\s", origin), "Public web origin contains whitespace")
    parsed_origin = urlsplit(origin)
    require(parsed_origin.scheme in ("http", "https") and bool(parsed_origin.hostname) and
            not parsed_origin.username and not parsed_origin.password and
            parsed_origin.path in ("", "/") and not parsed_origin.query and not parsed_origin.fragment,
            "Use a public HTTP(S) origin without credentials or parameters")
    origin = origin.rstrip("/")

    verified: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    seen_paths: set[str] = set()
    for index, page in enumerate(pages, 1):
        require(isinstance(page, dict), f"Page {index}: invalid manifest entry")
        url = validate_url(page.get("url"))
        require(url not in seen_urls, f"Repeated public URL: {url}")
        seen_urls.add(url)
        require(isinstance(page.get("title"), str) and bool(page["title"].strip()), f"{url}: title is missing")
        require(isinstance(page.get("family"), str) and bool(page["family"].strip()), f"{url}: family is missing")
        require(not SECRET_LIKE.search(url + page["title"] + page["family"]), f"{url}: page metadata contains secret-like material")
        html_path, html_name = source_file(source, page.get("html"), "html")
        json_path, json_name = source_file(source, page.get("jsonld"), "jsonld")
        require(html_name not in seen_paths and json_name not in seen_paths, f"{url}: repeated artifact path")
        seen_paths.update((html_name, json_name))
        html_bytes, json_bytes = html_path.read_bytes(), json_path.read_bytes()
        parser = VisibleFaqParser()
        try:
            parser.feed(html_bytes.decode("utf-8-sig"))
            parser.close()
        except UnicodeError as error:
            raise VerificationError(f"{url}: visible HTML is not UTF-8") from error
        visible = parser.items()
        check_text_items(visible, url)
        schema = parse_json(json_bytes, f"{url}: JSON-LD")
        require(isinstance(schema, dict) and schema.get("@context") == "https://schema.org" and
                schema.get("@type") == "FAQPage", f"{url}: expected FAQPage JSON-LD")
        require(set(schema) == {"@context", "@type", "@id", "url", "mainEntity"}, f"{url}: JSON-LD contains unsupported fields")
        absolute_url = origin + url
        require(schema.get("url") == absolute_url and schema.get("@id") == absolute_url + "#assistant-faq",
                f"{url}: JSON-LD identifies a different page")
        entities = schema.get("mainEntity")
        require(isinstance(entities, list), f"{url}: JSON-LD questions are missing")
        structured = []
        for entity in entities:
            require(isinstance(entity, dict) and entity.get("@type") == "Question", f"{url}: invalid schema question")
            require(set(entity) == {"@type", "name", "acceptedAnswer"}, f"{url}: schema question contains unsupported fields")
            accepted = entity.get("acceptedAnswer")
            require(isinstance(accepted, dict) and accepted.get("@type") == "Answer", f"{url}: invalid schema answer")
            require(set(accepted) == {"@type", "text"}, f"{url}: schema answer contains unsupported fields")
            structured.append({"question": entity.get("name"), "answer": accepted.get("text")})
        check_text_items(structured, url)
        require(visible == structured, f"{url}: visible HTML/JSON-LD text parity failed")
        require(type(page.get("questions")) is int and page["questions"] == len(visible),
                f"{url}: declared question count is incorrect")
        text_hash = hashlib.sha256(json.dumps(visible, ensure_ascii=False, separators=(",", ":")).encode("utf-8")).hexdigest()
        require(isinstance(page.get("sha256"), str) and page["sha256"] == text_hash,
                f"{url}: FAQ text SHA-256 does not match the export manifest")
        verified.append({"url": url, "title": page["title"], "family": page["family"], "questions": len(visible),
                         "faqTextSha256": text_hash, "html": html_name, "jsonld": json_name,
                         "htmlBytes": html_bytes, "jsonldBytes": json_bytes})
    require(type(manifest.get("questionCount")) is int and
            manifest["questionCount"] == sum(page["questions"] for page in verified),
            "Declared question total does not match verified pages")
    return manifest, verified, manifest_bytes


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def archive_index(pages: list[dict[str, Any]], key: str, label: str) -> bytes:
    rows = []
    for page in pages:
        rows.append(f'<tr><td>{html.escape(page["title"])}<small>{html.escape(page["url"])}</small></td>'
                    f'<td><a href="{html.escape(page[key], quote=True)}">{label}</a></td></tr>')
    text = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width"><title>American Moving Choice FAQs</title>'
            '<style>body{font:16px/1.5 system-ui;max-width:1100px;margin:32px auto;padding:0 20px;color:#102641}'
            'table{width:100%;border-collapse:collapse}td{padding:16px;border-bottom:1px solid #dae3ed;overflow-wrap:anywhere}'
            'small{display:block;color:#53657a}a{color:#074e94}</style></head><body>'
            f'<h1>American Moving Choice: {label}</h1><p>{len(pages):,} verified pages. '
            'Each answer contains 40–80 words and matches its companion format word for word.</p>'
            '<table><thead><tr><th>Page</th><th>Output</th></tr></thead><tbody>' +
            "\n".join(rows) + '</tbody></table></body></html>')
    return text.encode("utf-8")


def write_archive(destination: Path, manifest: dict[str, Any], pages: list[dict[str, Any]],
                  key: str, label: str) -> None:
    mapped = [{"url": page["url"], "title": page["title"], "family": page["family"],
               "questions": page["questions"], "file": page[key],
               "sha256": hashlib.sha256(page[key + "Bytes"]).hexdigest(),
               "faqTextSha256": page["faqTextSha256"]} for page in pages]
    own_manifest = {"format": "visible-html" if key == "html" else "faq-jsonld",
                    "webUrl": manifest["webUrl"], "exportedAt": manifest.get("exportedAt"),
                    "sourceSnapshotSha256": manifest["sourceSnapshotSha256"],
                    "exportedPages": len(pages), "questionCount": sum(page["questions"] for page in pages),
                    "verification": "Every decoded h3/p question and answer exactly equals its FAQPage JSON-LD text.",
                    "pages": mapped}
    with zipfile.ZipFile(destination, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=7) as archive:
        archive.writestr("index.html", archive_index(pages, key, label))
        archive.writestr("manifest.json", json_bytes(own_manifest))
        for page in pages:
            archive.writestr(page[key], page[key + "Bytes"])
    with zipfile.ZipFile(destination) as archive:
        require(archive.testzip() is None, f"Archive integrity failed: {destination.name}")
        require(len(archive.namelist()) == len(pages) + 2, "Archive includes unexpected files")


def package_export(source_arg: Path, out_arg: Path) -> dict[str, Any]:
    source = source_arg.resolve(strict=True)
    require(source.is_dir(), "Source must be an export directory")
    require(not out_arg.exists() and not out_arg.is_symlink(), "Refusing to overwrite an existing delivery path")
    destination = out_arg.resolve()
    require(not destination.exists(), "Refusing to overwrite an existing delivery directory")
    # Validate all source records and retain only the verified public format bytes in memory.
    # No destination directory/archive is created for an incomplete or tampered export.
    manifest, pages, manifest_bytes = verify_export(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.mkdir(exist_ok=False)
    html_zip = destination / "visible-html.zip"
    jsonld_zip = destination / "faq-jsonld.zip"
    write_archive(html_zip, manifest, pages, "html", "Visible HTML")
    write_archive(jsonld_zip, manifest, pages, "jsonld", "FAQPage JSON-LD")
    summary = {"verifiedAt": datetime.now(timezone.utc).isoformat(), "verifiedPages": len(pages),
               "verifiedQuestions": sum(page["questions"] for page in pages),
               "sourceGuideCount": manifest["sourceGuideCount"],
               "sourceSnapshotSha256": manifest["sourceSnapshotSha256"],
               "sourceManifestSha256": hashlib.sha256(manifest_bytes).hexdigest(),
               "sourceSnapshotDigestProvenance": "Copied from the export manifest; raw snapshot is deliberately excluded.",
               "checks": {"allPagesChecked": True, "decodedHtmlEqualsJsonLd": True,
                          "questionsPerPage": "4–5", "answerWords": "40–80", "businessNamedInEveryAnswer": True,
                          "perPageQuestionAndAnswerDuplicates": 0, "unsafeSourcePaths": 0,
                          "rawSnapshotsOrSecretsIncluded": False, "independentArchiveIndexes": True},
               "archives": [{"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                              "bytes": path.stat().st_size, "pageFiles": len(pages)}
                             for path in (html_zip, jsonld_zip)]}
    (destination / "verification-summary.json").write_bytes(json_bytes(summary))
    return {"packagedPages": len(pages), "questions": summary["verifiedQuestions"],
            "htmlArchive": str(html_zip), "jsonldArchive": str(jsonld_zip),
            "verificationSummary": str(destination / "verification-summary.json"),
            "sourceSnapshotSha256": manifest["sourceSnapshotSha256"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(package_export(args.source, args.out), ensure_ascii=False))
        return 0
    except (VerificationError, OSError, UnicodeError) as error:
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
