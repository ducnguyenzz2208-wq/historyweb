/*
 * scripts/translate-all.mjs — Dịch tự động hàng loạt toàn bộ bài viết & nhân vật
 * Tạo tệp .en.md và bổ sung metadata tiếng Anh cho index.json
 */

import fs from 'fs';
import path from 'path';
import '../assets/js/translator.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('=== BẮT ĐẦU DỊCH TỰ ĐỘNG TOÀN BỘ BÀI VIẾT & NHÂN VẬT ===\n');

  // 1. Xử lý Posts
  const postsJsonPath = './posts/index.json';
  const postsData = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
  const posts = postsData.posts;
  console.log(`[POSTS] Tổng cộng ${posts.length} bài viết.`);

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const viPath = p.files?.vi || p.file;
    const enPath = `posts/${p.slug}.en.md`;

    console.log(`\n[${i + 1}/${posts.length}] Sự kiện: ${p.slug}`);

    // Bổ sung metadata tiếng Anh nếu thiếu
    const viTitle = typeof p.title === 'object' ? p.title.vi : p.title;
    if (!p.title || typeof p.title !== 'object' || !p.title.en) {
      const enTitle = await globalThis.Translator.translateText(viTitle, 'vi', 'en');
      p.title = { vi: viTitle, en: enTitle };
      console.log(`  + Dịch tiêu đề: "${viTitle}" -> "${enTitle}"`);
    }

    const viExcerpt = typeof p.excerpt === 'object' ? p.excerpt.vi : (p.excerpt || '');
    if (!p.excerpt || typeof p.excerpt !== 'object' || !p.excerpt.en) {
      if (viExcerpt) {
        const enExcerpt = await globalThis.Translator.translateText(viExcerpt, 'vi', 'en');
        p.excerpt = { vi: viExcerpt, en: enExcerpt };
        console.log(`  + Dịch tóm tắt -> "${enExcerpt.slice(0, 40)}..."`);
      }
    }

    if (p.place) {
      const viPlace = typeof p.place === 'object' ? p.place.vi : p.place;
      if (typeof p.place !== 'object' || !p.place.en) {
        const enPlace = await globalThis.Translator.translateText(viPlace, 'vi', 'en');
        p.place = { vi: viPlace, en: enPlace };
      }
    }

    if (p.era) {
      const viEra = typeof p.era === 'object' ? p.era.vi : p.era;
      if (typeof p.era !== 'object' || !p.era.en) {
        const enEra = await globalThis.Translator.translateText(viEra, 'vi', 'en');
        p.era = { vi: viEra, en: enEra };
      }
    }

    // Dịch thân bài nếu chưa có file .en.md
    if (!fs.existsSync(enPath) && fs.existsSync(viPath)) {
      const t0 = Date.now();
      process.stdout.write(`  + Đang dịch thân bài Markdown (${viPath} -> ${enPath})... `);
      const viMd = fs.readFileSync(viPath, 'utf8');
      const enMd = await globalThis.Translator.translateMarkdown(viMd, 'vi', 'en');
      fs.writeFileSync(enPath, enMd.trim() + '\n', 'utf8');
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`xong (${sec}s)`);
    } else if (fs.existsSync(enPath)) {
      console.log(`  - Đã có ${enPath}, bỏ qua.`);
    }

    p.files = {
      vi: viPath,
      en: enPath,
    };

    await sleep(200);
  }

  fs.writeFileSync(postsJsonPath, JSON.stringify(postsData, null, 2) + '\n', 'utf8');
  console.log('\n✓ Đã cập nhật posts/index.json');

  // 2. Xử lý Figures
  const figsJsonPath = './figures/index.json';
  const figsData = JSON.parse(fs.readFileSync(figsJsonPath, 'utf8'));
  const figures = figsData.figures;
  console.log(`\n[FIGURES] Tổng cộng ${figures.length} nhân vật.`);

  for (let i = 0; i < figures.length; i++) {
    const f = figures[i];
    const viPath = f.files?.vi || f.file;
    const enPath = `figures/${f.slug}.en.md`;

    console.log(`\n[${i + 1}/${figures.length}] Nhân vật: ${f.slug}`);

    // Bổ sung metadata tiếng Anh
    const viName = typeof f.name === 'object' ? f.name.vi : f.name;
    if (!f.name || typeof f.name !== 'object' || !f.name.en) {
      const enName = await globalThis.Translator.translateText(viName, 'vi', 'en');
      f.name = { vi: viName, en: enName };
      console.log(`  + Dịch tên: "${viName}" -> "${enName}"`);
    }

    const viRole = typeof f.role === 'object' ? f.role.vi : (f.role || '');
    if (!f.role || typeof f.role !== 'object' || !f.role.en) {
      if (viRole) {
        const enRole = await globalThis.Translator.translateText(viRole, 'vi', 'en');
        f.role = { vi: viRole, en: enRole };
        console.log(`  + Dịch vai trò: "${viRole}" -> "${enRole}"`);
      }
    }

    const viField = typeof f.field === 'object' ? f.field.vi : (f.field || '');
    if (!f.field || typeof f.field !== 'object' || !f.field.en) {
      if (viField) {
        const enField = await globalThis.Translator.translateText(viField, 'vi', 'en');
        f.field = { vi: viField, en: enField };
      }
    }

    const viExcerpt = typeof f.excerpt === 'object' ? f.excerpt.vi : (f.excerpt || '');
    if (!f.excerpt || typeof f.excerpt !== 'object' || !f.excerpt.en) {
      if (viExcerpt) {
        const enExcerpt = await globalThis.Translator.translateText(viExcerpt, 'vi', 'en');
        f.excerpt = { vi: viExcerpt, en: enExcerpt };
      }
    }

    const viEra = typeof f.era === 'object' ? f.era.vi : (f.era || '');
    if (!f.era || typeof f.era !== 'object' || !f.era.en) {
      if (viEra) {
        const enEra = await globalThis.Translator.translateText(viEra, 'vi', 'en');
        f.era = { vi: viEra, en: enEra };
      }
    }

    // Dịch thân bài
    if (!fs.existsSync(enPath) && fs.existsSync(viPath)) {
      const t0 = Date.now();
      process.stdout.write(`  + Đang dịch thân bài Markdown (${viPath} -> ${enPath})... `);
      const viMd = fs.readFileSync(viPath, 'utf8');
      const enMd = await globalThis.Translator.translateMarkdown(viMd, 'vi', 'en');
      fs.writeFileSync(enPath, enMd.trim() + '\n', 'utf8');
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`xong (${sec}s)`);
    } else if (fs.existsSync(enPath)) {
      console.log(`  - Đã có ${enPath}, bỏ qua.`);
    }

    f.files = {
      vi: viPath,
      en: enPath,
    };

    await sleep(200);
  }

  fs.writeFileSync(figsJsonPath, JSON.stringify(figsData, null, 2) + '\n', 'utf8');
  console.log('\n✓ Đã cập nhật figures/index.json');

  console.log('\n🎉 HOÀN THÀNH DỊCH TOÀN BỘ 26 SỰ KIỆN VÀ 19 NHÂN VẬT THÀNH SONG NGỮ!');
}

run().catch((err) => {
  console.error('Lỗi khi chạy translate-all:', err);
  process.exit(1);
});
