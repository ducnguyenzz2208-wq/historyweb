"""Validate built HTML structurally without executing JavaScript."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json, re
ROOT = Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.refs, self.ids, self.headings, self.canonical, self.base, self.main_text = [], set(), 0, "", "", []
        self.inmain = False
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'main': self.inmain = True
        if tag == 'h1': self.headings += 1
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, ('duplicate id', attrs['id'])
            self.ids.add(attrs['id'])
        if tag == 'base': self.base = attrs.get('href', '')
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical = attrs.get('href', '')
        if tag != 'base':
            for key in ['href', 'src']:
                if attrs.get(key): self.refs.append(attrs[key])
        assert not any(key.lower().startswith('on') for key in attrs), (tag, attrs)
        assert all(not re.match(r'^(javascript|vbscript):', attrs.get(key, ''), re.I) for key in ['href','src'])
    def handle_endtag(self, tag):
        if tag == 'main': self.inmain = False
    def handle_data(self, text):
        if self.inmain: self.main_text.append(text)

pages = 0
for kind, folder in [('post', 'posts'), ('figure', 'figures')]:
    for item in json.loads((ROOT/folder/'index.json').read_text(encoding='utf-8'))[folder]:
        for lang in ['vi', 'en']:
            name = f"{item['slug']}{'.en' if lang == 'en' else ''}.html"
            relative = f'{kind}/{name}'
            text = (ROOT/relative).read_text(encoding='utf-8')
            page = Page(text)
            assert page.base == '../', relative
            assert page.headings == 1, (relative, page.headings)
            assert len(''.join(page.main_text)) > 400, relative
            assert f'<html lang="{lang}"' in text, relative
            assert page.canonical.endswith('/' + relative), relative
            assert page.canonical in (ROOT/'sitemap.xml').read_text(encoding='utf-8'), relative
            assert 'id="staticCitation"' in text and 'id="staticCitationStyle"' in text, relative
            assert 'location.replace' not in text, relative
            assert 'assets/js/static-page.js' in text, relative
            assert not re.search(r'<script src="assets/js/(post|figure|translator)\.js', text), relative
            assert 'id="staticRoot"' in text and 'class="prose"' in text and 'class="infobox glass"' in text, relative
            for ref in page.refs:
                parsed = urlparse(ref)
                if parsed.scheme or parsed.netloc: continue
                target = ROOT / unquote(parsed.path)
                assert target.exists(), (relative, ref)
                if parsed.fragment and parsed.path == relative:
                    assert unquote(parsed.fragment) in page.ids, (relative, ref)
            pages += 1
audit = json.loads((ROOT/'assets/data/source-audit.json').read_text(encoding='utf-8'))
assert len(audit['items']) == 55
assert all(item['sources'] for item in audit['items'])
assert all(item['reviewStatus'] == 'pending_claim_review' for item in audit['items'])
assert all(all(k in image for k in ['url','sourcePage','author','license','licenseUrl','status','uses']) for image in audit['images'])
print(f'OK {pages} static HTML pages: no-JS content, unique H1, language, canonical, relative resources, footnote/TOC anchors and source inventory passed.')
