"""Replace only images positively identified as missing by the Commons API."""
from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parent.parent
path = ROOT/'assets/data/source-audit.json'
report = json.loads(path.read_text(encoding='utf-8'))
bad = {image['url'] for image in report['images'] if image['status'] == 'missing_commons_file'}
replacement = 'assets/images/review-pending.svg'
records = []
for folder in ['posts','figures']:
    indexpath = ROOT/folder/'index.json'
    data = json.loads(indexpath.read_text(encoding='utf-8'))
    for item in data[folder]:
        for key in ['cover','portrait']:
            if item.get(key) in bad:
                records.append(dict(file=str(indexpath.relative_to(ROOT)), slug=item['slug'], original=item[key], replacement=replacement, reason='Commons API: missing file', checkedAt='2026-10-08'))
                item[key] = replacement
    indexpath.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for file in (ROOT/folder).glob('*.md'):
        text = file.read_text(encoding='utf-8')
        changed = text
        for url in bad:
            def replace(match):
                records.append(dict(file=str(file.relative_to(ROOT)), original=url, replacement=replacement, reason='Commons API: missing file', checkedAt='2026-10-08'))
                return f'![Ảnh tư liệu đang được đối chiếu]({replacement} "Historical image pending source review |right")'
            changed = re.sub(r'!\[[^\]]*\]\('+re.escape(url)+r'(?:\s+"[^"]*")?\)',replace,changed)
        if changed != text: file.write_text(changed,encoding='utf-8')
dest = ROOT/'assets/data/image-remediations.json'
existing = json.loads(dest.read_text(encoding='utf-8')) if dest.exists() else []
dest.write_text(json.dumps(existing+records,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Replaced {len(records)} confirmed broken image uses; original URLs preserved in image-remediations.json.')
