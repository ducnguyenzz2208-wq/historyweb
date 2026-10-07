"""Inventory source claims and verify Commons file metadata; never infer licenses.
Run explicitly with network access. The saved report is used by offline builds.
"""
import concurrent.futures, datetime, html, json, pathlib, re, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
TODAY = "2026-10-08"
def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))
def plain(value):
    return html.unescape(re.sub(r"<[^>]*>", "", value or "")).strip()
def commons_title(url):
    parsed = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(parsed.path)
    if parsed.hostname == "commons.wikimedia.org" and "/Special:FilePath/" in path:
        return "File:" + path.split("/Special:FilePath/", 1)[1]
    if parsed.hostname == "upload.wikimedia.org" and "/wikipedia/commons/" in path:
        parts = path.split("/")
        return "File:" + (parts[-2] if "/thumb/" in path else parts[-1])
    return None
def fetch_batch(titles):
    query = urllib.parse.urlencode(dict(action="query", format="json", redirects=1, titles="|".join(titles), prop="imageinfo", iiprop="url|extmetadata"))
    request = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + query, headers={"User-Agent": "Historyweb-source-audit/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            data = json.load(response)
        pages = {p["title"].replace("_", " "): p for p in data.get("query", {}).get("pages", {}).values()}
        redirects = {r["from"].replace("_", " "): r["to"].replace("_", " ") for r in data.get("query", {}).get("redirects", [])}
        result = {}
        for title in titles:
            name = title.replace("_", " ")
            result[title] = pages.get(redirects.get(name, name), {})
        return result
    except Exception as error:
        return {title: {"auditError": type(error).__name__} for title in titles}

# These are starting points for editorial review, not claim-level verification.
CANDIDATES = {
    "cach-mang-thang-muoi-nga": ("The National Archives — Spotlight On: Russian Revolution", "https://www.nationalarchives.gov.uk/education/students/videos/spotlight-on/spotlight-on-russian-revolution/"),
    "vi-lenin": ("The National Archives — Russia in Revolution", "https://www.nationalarchives.gov.uk/education/education-sessions/russia-in-revolution/"),
    "su-ra-doi-va-troi-day-cua-nvidia": ("NVIDIA — Corporate Timeline", "https://www.nvidia.com/en-eu/about-nvidia/corporate-timeline/"),
    "con-duong-to-lua": ("UNESCO — About the Silk Roads", "https://www.unesco.org/en/silk-roads/about-silk-roads?hub=196704"),
    "cach-mang-cong-nghiep": ("Science and Industry Museum — The attraction of steam", "https://blog.scienceandindustrymuseum.org.uk/the-attraction-of-steam/"),
    "alexander-dai-de": ("The Metropolitan Museum of Art — Art of the Hellenistic Age", "https://www.metmuseum.org/essays/art-of-the-hellenistic-age-and-the-hellenistic-tradition"),
    "ba-trieu": ("Bảo tàng Lịch sử Quốc gia — Khu di tích Bà Triệu", "https://baotanglichsu.vn/vi/Articles/3091/17585/khu-di-tich-ba-trieu-djuoc-xep-hang-quoc-gia-djac-biet.html"),
    "dinh-tien-hoang": ("Bảo tàng Lịch sử Quốc gia — Nhà Đinh với sự nghiệp thống nhất đất nước", "https://baotanglichsu.vn/vi/Articles/3096/10060/nha-djinh-voi-su-nghiep-thong-nhat-djat-nuoc.html"),
    "ho-chi-minh": ("Bảo tàng Hồ Chí Minh — Hồ Chí Minh tiểu sử", "https://baotanghochiminh.vn/ho-chi-minh-tieu-su.htm"),
    "tran-hung-dao": ("Bảo tàng Lịch sử Quốc gia — Khí phách của Trần Quốc Tuấn", "https://baotanglichsu.vn/vi/Articles/2001/66052/khi-phach-ngat-troi-cua-tran-quoc-tuan.html"),
    "nguyen-trai": ("Bảo tàng Lịch sử Quốc gia — Nguyễn Trãi (1380–1442)", "https://baotanglichsu.vn/vi/Articles/3098/18122/nguyen-trai-anh-hung-dan-toc-danh-nhan-van-hoa-1380-1442.html"),
    "napoleon-bonaparte": ("Fondation Napoléon — Timeline: Consulate/1st French Empire", "https://www.napoleon.org/en/young-historians/napodoc/timeline-consulate1st-french-empire/"),
    "alan-turing": ("King's College Cambridge — Alan Turing", "https://www.kings.cam.ac.uk/alan-mathison-turing-1912-54"),
    "isaac-newton": ("Trinity College Cambridge — Isaac Newton", "https://explore.trin.cam.ac.uk/assets/isaac-newton-by-roubiliac/"),
    "apollo-11-1969": ("NASA — Apollo 11", "https://www.nasa.gov/mission/apollo-11/"),
    "su-ra-doi-cua-internet": ("Internet Society — A Brief History of the Internet", "https://www.internetsociety.org/internet/history-internet/brief-history-internet/"),
    "abraham-lincoln": ("White House Historical Association — Abraham Lincoln", "https://www.whitehousehistory.org/bios/abraham-lincoln"),
    "lionel-messi": ("FC Barcelona — Lionel Messi", "https://www.fcbarcelona.com/en/football/first-team/players/4974/lionel-andres-messi"),
    "conor-mcgregor": ("UFC — Conor McGregor", "https://www.ufc.com/athlete/conor-mcgregor"),
    "leonardo-da-vinci": ("Royal Collection Trust — Leonardo da Vinci", "https://www.rct.uk/collection/themes/trails/leonardo-da-vinci"),
}
items, images, datafiles = [], {}, {}
previous = {}
if (ROOT / "assets/data/source-audit.json").exists():
    previous = {r["url"]: r for r in load("assets/data/source-audit.json")["images"]}
for kind, folder, titlekey in [("post", "posts", "title"), ("figure", "figures", "name")]:
    data = load(f"{folder}/index.json")
    datafiles[folder] = data
    for item in data[folder]:
        for language in ["vi", "en"]:
            translated = f"{folder}/{item['slug']}.{language}.md"
            if (ROOT / translated).exists(): item.setdefault("files", {}).setdefault(language, translated)
        sources, files = [], list(dict.fromkeys([item.get("file", ""), *item.get("files", {}).values()]))
        used_images = []
        cover = item.get("cover") or item.get("portrait")
        if cover: used_images.append(cover)
        for file in filter(None, files):
            text = (ROOT / file).read_text(encoding="utf-8")
            for citation in re.findall(r"^\[\^[^\]]+\]:\s*(.+)$", text, re.M):
                sources.append(dict(label=citation, url="", status="pending_claim_review", file=file))
            for label, url in re.findall(r"(?<!!)\[([^\]]+)\]\((https?://[^\s)]+)\)", text):
                sources.append(dict(label=label, url=url, status="pending_claim_review", file=file))
            used_images += re.findall(r"!\[[^\]]*\]\(([^\s)]+)", text)
            # Text references without footnote syntax.
            section = re.search(r"^##\s+(?:Nguồn tham khảo|Tham khảo|References|Sources|Further reading)\s*\n([\s\S]+)", text, re.M | re.I)
            if section:
                for line in section.group(1).splitlines():
                    if line.strip().startswith(("- ", "* ")):
                        sources.append(dict(label=line.strip()[2:], url="", status="pending_claim_review", file=file))
        if item["slug"] in CANDIDATES:
            label, url = CANDIDATES[item["slug"]]
            sources.append(dict(label=label, url=url, status="candidate_not_claim_verified"))
        if not sources:
            # A discoverable review queue is preferable to invented references.
            sources.append(dict(label="Chưa có tài liệu tham khảo được ghi nhận — cần biên tập bổ sung.", url="", status="missing_source"))
        sources = list({(s["label"], s["url"]): s for s in sources}.values())
        entry = dict(kind=kind, slug=item["slug"], title=item[titlekey], sources=sources, images=list(dict.fromkeys(used_images)), reviewStatus="pending_claim_review")
        items.append(entry)
        item["verified"] = False
        item["reviewStatus"] = "pending_claim_review"
        for url in entry["images"]:
            record = images.setdefault(url, dict(url=url, sourcePage="", author="", license="", licenseUrl="", status="unverified", uses=[], previousCredits=previous.get(url, {}).get("previousCredits", [])))
            record["uses"].append(f"{kind}/{item['slug']}")
            record["commonsTitle"] = commons_title(url)
            if cover == url: record.setdefault("previousCredits", []).append(item.get("credit", ""))

for page in ROOT.glob("*.html"):
    for url in re.findall(r'<img\b[^>]*\bsrc="(https?://[^"]+)"', page.read_text(encoding="utf-8")):
        record = images.setdefault(url, dict(url=url, sourcePage="", author="", license="", licenseUrl="", status="unverified", uses=[], previousCredits=previous.get(url, {}).get("previousCredits", []), commonsTitle=commons_title(url)))
        record["uses"].append("page:"+page.name)
titles = sorted({r["commonsTitle"] for r in images.values() if r["commonsTitle"]})
batches = [titles[i:i+15] for i in range(0, len(titles), 15)]
metadata = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for result in pool.map(fetch_batch, batches): metadata.update(result)
for record in images.values():
    title = record.pop("commonsTitle")
    if record["url"] == "assets/images/review-pending.svg":
        record.update(sourcePage="assets/images/review-pending.svg", author="Dòng Chảy Lịch Sử", license="Original project illustration; not historical media", licenseUrl="", status="project_owned_placeholder", checkedAt=TODAY)
    if not title: continue
    record["sourcePage"] = "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"), safe=":")
    page = metadata.get(title, {})
    info = page.get("imageinfo", [{}])[0]
    ext = info.get("extmetadata", {})
    record.update(author=plain(ext.get("Artist", {}).get("value")), license=plain(ext.get("LicenseShortName", {}).get("value")), licenseUrl=plain(ext.get("LicenseUrl", {}).get("value")))
    record["sourcePage"] = info.get("descriptionurl", record["sourcePage"])
    if "missing" in page: record["status"] = "missing_commons_file"
    elif record["author"] and record["license"]:
        record["status"] = "metadata_confirmed_pending_editorial_review"
    if page.get("auditError"): record["auditError"] = page["auditError"]
    record["checkedAt"] = TODAY

for folder, data in datafiles.items():
    for item in data[folder]:
        cover = item.get("cover") or item.get("portrait")
        if cover:
            record = images[cover]
            if record["status"] == "metadata_confirmed_pending_editorial_review":
                item["credit"] = f"{record['author']} — {record['license']}"
            elif record["status"] == "project_owned_placeholder": item["credit"] = "Dòng Chảy Lịch Sử — Minh họa dự phòng, không phải ảnh tư liệu"
            else: item["credit"] = "Nguồn gốc / giấy phép ảnh chưa được xác minh"
            item["imageSource"] = {k: record[k] for k in ["sourcePage", "author", "license", "licenseUrl", "status"]}
    (ROOT / folder / "index.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

for record in images.values(): record["previousCredits"] = list(dict.fromkeys(record["previousCredits"]))
remediations = load("assets/data/image-remediations.json") if (ROOT / "assets/data/image-remediations.json").exists() else []
report = dict(updatedAt=TODAY, policy="References and Commons metadata are an audit inventory, not claim-level verification or a legal clearance.", items=items, images=list(images.values()), remediations=remediations)
(ROOT / "assets/data/source-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
lines = ["# Kiểm tra nguồn và ảnh", "", f"Ngày: {TODAY}. {len(items)} mục nội dung; {len(images)} URL ảnh riêng biệt.", "", "## Trạng thái và nguyên tắc", "", "- Chỉ gắn verified khi có người duyệt, ngày duyệt và bằng chứng đối chiếu từng nhận định quan trọng.", "- metadata_confirmed_pending_editorial_review: API Commons trả tác giả/giấy phép; chưa xác nhận ảnh khớp ngữ cảnh hoặc hoàn thành mọi điều kiện sử dụng.", "- unverified: chưa có bằng chứng nguồn gốc/giấy phép. missing_commons_file: tên file Commons không tồn tại.", "- Nguồn sách/URL liệt kê trong bài là nguồn cần kiểm tra, không tự xem là chứng cứ đã đọc.", "- Không bịa số trang hoặc giấy phép. Nội dung thiếu nguồn phải bổ sung trước khi gắn nhãn kiểm chứng.", "", "Hướng dẫn ghi công: [Wikimedia Commons](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia).", "", "## Nội dung cần đối chiếu", "", "| Mục | Nguồn được ghi nhận | Trạng thái |", "|---|---:|---|"]
for item in items:
    missing = any(s["status"] == "missing_source" for s in item["sources"])
    lines.append(f"| [{item['slug']}]({item['kind']}/{item['slug']}.html) | {len(item['sources'])} | {'Thiếu nguồn' if missing else 'Chờ đối chiếu nhận định / số trang'} |")
lines += ["", "## Hồ sơ ảnh", "", "Mọi URL và nơi sử dụng được lưu trong `assets/data/source-audit.json`. Các dòng credit cũ được giữ trong previousCredits để đối chiếu, không tiếp tục coi là giấy phép đã xác nhận.", ""]
for record in images.values():
    lines += [f"### Ảnh {len([x for x in lines if x.startswith('### Ảnh')]) + 1}", f"- URL: {record['url']}", f"- Dùng tại: {', '.join(dict.fromkeys(record['uses']))}", f"- Trang nguồn: {record['sourcePage'] or 'Chưa xác định'}", f"- Tác giả: {record['author'] or 'Chưa xác định'}", f"- Giấy phép: {record['license'] or 'Chưa xác định'}", f"- Link giấy phép: {record['licenseUrl'] or 'Chưa xác định'}", f"- Trạng thái: {record['status']}", ""]
lines += ["## Ảnh hỏng đã xử lý", "", f"{len(remediations)} lần sử dụng ảnh có file Commons không tồn tại đã đổi sang minh họa dự phòng của dự án. Không dùng minh họa này làm chứng cứ lịch sử. URL gốc và lý do được giữ trong `assets/data/image-remediations.json`.", ""]
(ROOT / "SOURCE_AUDIT.md").write_text("\n".join(lines), encoding="utf-8")
from collections import Counter
print(json.dumps(dict(items=len(items), images=len(images), imageStatus=dict(Counter(r["status"] for r in images.values())), missingSources=sum(any(s["status"] == "missing_source" for s in i["sources"]) for i in items)), ensure_ascii=False))
