import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({ window: {}, URL });
vm.runInContext(readFileSync("assets/js/md.js", "utf8"), context);
const { mdToHtml: render, hwMarkdownUrl: url, hwEscapeHtml: escape } = context.window;
let checks = 0;
function check(name, callback) {
  callback(); checks++;
  console.log(`✓ ${name}`);
}

check("Reject active URL schemes, controls, protocol-relative and backslash URLs", () => {
  for (const value of ["javascript:alert%281%29", "JaVaScRiPt:alert%281%29", "vbscript:msgbox", "file:///etc/passwd", "blob:https://example.com/id", "//example.com/a", "\\\\example.com/a", "java\tscript:alert", "https://example.com/\nfile"]) {
    assert.equal(url(value), "", value);
    assert.equal(url(value, true), "", value);
    assert.doesNotMatch(render(`[link](${value})`), /<a\b/);
  }
});

check("Preserve web, email, fragment and relative links", () => {
  for (const value of ["https://example.com/a?q=1&v=2", "http://example.com", "mailto:author@example.com", "#section", "../figure.html?slug=ly-thuong-kiet", "assets/uploads/photo.png"]) {
    assert.equal(url(value), value);
    assert.match(render(`[link](${value})`), /<a href=/);
  }
  assert.equal(url("mailto:author@example.com", true), "");
});

check("Only raster base64 data is accepted for images", () => {
  assert.match(render("![preview](data:image/png;base64,aGVsbG8=)"), /<img src="data:image\/png/);
  for (const value of ["data:text/html;base64,aGVsbG8=", "data:image/svg+xml;base64,aGVsbG8=", "data:image/png,hello"]) {
    assert.equal(url(value, true), "");
    assert.doesNotMatch(render(`![preview](${value})`), /<img\b/);
  }
  assert.equal(url("data:image/png;base64,aGVsbG8="), "");
});

check("Escape attributes in inline and captioned images and links", () => {
  const value = 'https://example.com/a"onerror="alert';
  const image = render(`![a"onload="bad](${value})`);
  assert.ok(image.includes('src="https://example.com/a&quot;onerror=&quot;alert"'));
  assert.ok(image.includes('alt="a&quot;onload=&quot;bad"'));
  const figure = render(`![a"onload="bad](${value} "Caption |left")`);
  assert.ok(figure.includes('wiki-figure--left'));
  assert.ok(figure.includes('src="https://example.com/a&quot;onerror=&quot;alert"'));
  assert.ok(render(`[safe](${value})`).includes('href="https://example.com/a&quot;onerror=&quot;alert"'));
  assert.doesNotMatch(render('![alt](javascript:alert%281%29 "caption |right")'), /<img\b/);
});

check("Raw HTML and entities remain text, including TOC heading text", () => {
  assert.equal(render('<img src=x onerror=alert(1)>'), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
  assert.doesNotMatch(render('[x](javascript&#58;alert)'), /href="javascript:/);
  assert.match(render('## <img src=x onerror=alert(1)>'), /&lt;img/);
  assert.equal(escape('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  for (const file of ["assets/js/post.js", "assets/js/figure.js"]) {
    assert.ok(readFileSync(file, "utf8").includes('window.hwEscapeHtml(h.textContent)'), `${file}: TOC must escape heading text`);
  }
});

check("Emphasis cannot mutate generated URL attributes and alt text", () => {
  const html = render('![a_quoted_name](https://example.com/a_b_c.png) [link](https://example.com/**bold**/a_b_c)');
  assert.ok(html.includes('src="https://example.com/a_b_c.png"'));
  assert.ok(html.includes('alt="a_quoted_name"'));
  assert.ok(html.includes('href="https://example.com/**bold**/a_b_c"'));
  assert.match(render('**bold** *italic* _italic_'), /<strong>bold<\/strong> <em>italic<\/em> <em>italic<\/em>/);
});

check("Code is literal and internal placeholder text cannot forge markup", () => {
  assert.equal(render('`[x](javascript:alert) **bold** <img>`'), '<p><code>[x](javascript:alert) **bold** &lt;img&gt;</code></p>');
  assert.match(render('```html\n<script>bad()</script>\n```'), /<pre><code>&lt;script&gt;bad\(\)&lt;\/script&gt;<\/code><\/pre>/);
  assert.equal(render('\u0000CODE0\u0000'), '<p>CODE0</p>');
  assert.equal(render('\u0000INLINE0\u0000'), '<p>INLINE0</p>');
});

check("Headings, lists, captions and footnotes remain supported", () => {
  const html = render('## Bối cảnh\n\n## Bối cảnh\n\n- Một\n- Hai\n\n1. Ba\n\n> Trích dẫn\n\n![Ảnh](assets/uploads/a.png "Chú thích |left")\n\nNguồn[^1]\n\n[^1]: [Tài liệu](https://example.com/source)');
  for (const fragment of ['id="boi-canh"', 'id="boi-canh-1"', '<ul><li>Một</li><li>Hai</li></ul>', '<ol><li>Ba</li></ol>', '<blockquote>Trích dẫn</blockquote>', 'wiki-figure--left', 'id="fnref:1"', 'id="fn:1"', 'href="https://example.com/source"']) assert.ok(html.includes(fragment), fragment);
  assert.match(render('## constructor\n\n## __proto__'), /id="constructor"/);
  assert.doesNotMatch(render('Nguồn[^constructor]'), /fnref:/);
});

check("Every existing Markdown file renders without throwing", () => {
  let files = 0;
  for (const folder of ["posts", "figures"]) {
    for (const file of readdirSync(folder).filter((name) => name.endsWith(".md"))) {
      const html = render(readFileSync(`${folder}/${file}`, "utf8"));
      assert.equal(typeof html, "string");
      assert.doesNotMatch(html, /\u0000(?:INLINE|CODE)\d+\u0000/, file);
      files++;
    }
  }
  console.log(`  Rendered ${files} existing Markdown files.`);
});
console.log(`Passed ${checks} Markdown regression groups.`);
