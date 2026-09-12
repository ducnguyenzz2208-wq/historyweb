import fs from 'fs';

// 1. Thêm 5 Sự Kiện vào posts/index.json
const postsPath = './posts/index.json';
const postsData = JSON.parse(fs.readFileSync(postsPath, 'utf8'));

const newPosts = [
  {
    slug: "tran-nhu-nguyet-1077",
    title: {
      vi: "Trận Như Nguyệt năm 1077",
      en: "The Battle of Nhu Nguyet, 1077"
    },
    excerpt: {
      vi: "Thái úy Lý Thường Kiệt chặn đứng đại quân Tống bên bờ sông Cầu và cất cao bài thơ thần Nam quốc sơn hà.",
      en: "Supreme Commander Ly Thuong Kiet halted the massive Song invasion and immortalized the divine poem Nam quoc son ha."
    },
    year: "1077",
    region: "vietnam",
    era: {
      vi: "Trung đại",
      en: "Medieval"
    },
    tags: ["Việt Nam", "Lý Thường Kiệt", "nhà Lý", "quân sự", "thơ thần"],
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Song_Cau_%28Nhu_Nguyet%29.jpg/1280px-Song_Cau_%28Nhu_Nguyet%29.jpg",
    credit: "Wikimedia Commons (CC BY-SA 3.0)",
    lat: 21.2292,
    lng: 106.0594,
    place: {
      vi: "Sông Như Nguyệt (sông Cầu), Bắc Ninh – Bắc Giang",
      en: "Nhu Nguyet River (Cau River), Bac Ninh – Bac Giang"
    },
    file: "posts/tran-nhu-nguyet-1077.vi.md",
    lang: "vi",
    date: "2026-08-01",
    verified: true,
    files: {
      vi: "posts/tran-nhu-nguyet-1077.vi.md",
      en: "posts/tran-nhu-nguyet-1077.en.md"
    }
  },
  {
    slug: "khoi-nghia-ba-trieu-248",
    title: {
      vi: "Khởi nghĩa Bà Triệu năm 248",
      en: "Lady Trieu's Uprising, 248"
    },
    excerpt: {
      vi: "Nữ tướng Triệu Thị Trinh cưỡi voi vàng xung trận chống quân Đông Ngô: 'Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ'.",
      en: "Warrior Lady Trieu rode a war elephant against Eastern Wu forces with the vow to ride the storm and tread giant waves."
    },
    year: "248",
    region: "vietnam",
    era: {
      vi: "Cổ đại",
      en: "Ancient"
    },
    tags: ["Việt Nam", "Bà Triệu", "Bắc thuộc", "khởi nghĩa", "nữ anh hùng"],
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Lady_Trieu.jpg/800px-Lady_Trieu.jpg",
    credit: "Tranh dân gian Đông Hồ — Wikimedia Commons (Public Domain)",
    lat: 19.9208,
    lng: 105.7744,
    place: {
      vi: "Núi Tùng, Hậu Lộc, Thanh Hóa",
      en: "Tung Mountain, Hau Loc, Thanh Hoa"
    },
    file: "posts/khoi-nghia-ba-trieu-248.vi.md",
    lang: "vi",
    date: "2026-08-02",
    verified: true,
    files: {
      vi: "posts/khoi-nghia-ba-trieu-248.vi.md",
      en: "posts/khoi-nghia-ba-trieu-248.en.md"
    }
  },
  {
    slug: "phong-trao-can-vuong-1885",
    title: {
      vi: "Phong trào Cần Vương và Chiếu Cần Vương 1885",
      en: "The Can Vuong Movement and Edict, 1885"
    },
    excerpt: {
      vi: "Vua Hàm Nghi và Tôn Thất Thuyết xuất bôn ban Chiếu Cần Vương, dấy lên phong trào kháng Pháp sôi sục của sĩ phu yêu nước.",
      en: "Emperor Ham Nghi and Ton That Thuyet proclaimed the Can Vuong Edict, igniting a fierce nationwide anti-colonial movement."
    },
    year: "1885",
    region: "vietnam",
    era: {
      vi: "Cận đại",
      en: "Modern"
    },
    tags: ["Việt Nam", "Hàm Nghi", "kháng Pháp", "Cần Vương", "Huế"],
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/King_Ham_Nghi.jpg/800px-King_Ham_Nghi.jpg",
    credit: "Wikimedia Commons (Public Domain)",
    lat: 16.4698,
    lng: 107.5796,
    place: {
      vi: "Kinh thành Huế và Sơn phòng Tân Sở, Quảng Trị",
      en: "Hue Imperial Citadel and Tan So, Quang Tri"
    },
    file: "posts/phong-trao-can-vuong-1885.vi.md",
    lang: "vi",
    date: "2026-08-03",
    verified: true,
    files: {
      vi: "posts/phong-trao-can-vuong-1885.vi.md",
      en: "posts/phong-trao-can-vuong-1885.en.md"
    }
  },
  {
    slug: "khung-hoang-ten-lua-cuba-1962",
    title: {
      vi: "Khủng hoảng tên lửa Cuba năm 1962",
      en: "The Cuban Missile Crisis, 1962"
    },
    excerpt: {
      vi: "13 ngày cân não giữa Kennedy và Khrushchev đưa nhân loại tới sát bờ vực một cuộc chiến tranh hủy diệt hạt nhân toàn cầu.",
      en: "Thirteen days of tense standoff between Kennedy and Khrushchev brought humanity to the brink of nuclear war."
    },
    year: "1962",
    region: "world",
    era: {
      vi: "Hiện đại",
      en: "Contemporary"
    },
    tags: ["Thế giới", "Chiến tranh Lạnh", "Mỹ", "Liên Xô", "Cuba", "hạt nhân"],
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Cuban_crisis_map_missile_range.jpg/1024px-Cuban_crisis_map_missile_range.jpg",
    credit: "US Department of Defense — Wikimedia Commons (Public Domain)",
    lat: 23.1136,
    lng: -82.3666,
    place: {
      vi: "Havana, Cuba và Washington D.C., Hoa Kỳ",
      en: "Havana, Cuba and Washington D.C., USA"
    },
    file: "posts/khung-hoang-ten-lua-cuba-1962.vi.md",
    lang: "vi",
    date: "2026-08-04",
    verified: true,
    files: {
      vi: "posts/khung-hoang-ten-lua-cuba-1962.vi.md",
      en: "posts/khung-hoang-ten-lua-cuba-1962.en.md"
    }
  },
  {
    slug: "su-ra-doi-cua-internet",
    title: {
      vi: "Sự ra đời của Internet",
      en: "The Birth of the Internet"
    },
    excerpt: {
      vi: "Từ nút mạng thử nghiệm ARPANET năm 1969 đến World Wide Web của Tim Berners-Lee, xa lộ thông tin đã kết nối toàn thể nhân loại.",
      en: "From the first ARPANET nodes in 1969 to Tim Berners-Lee's World Wide Web, the global network reshaped human civilization."
    },
    year: "1969",
    region: "world",
    era: {
      vi: "Hiện đại",
      en: "Contemporary"
    },
    tags: ["Thế giới", "công nghệ", "Internet", "khoa học", "World Wide Web"],
    cover: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ARPANET_logical_map%2C_march_1977.png/1024px-ARPANET_logical_map%2C_march_1977.png",
    credit: "DARPA — Wikimedia Commons (Public Domain)",
    lat: 34.0689,
    lng: -118.4452,
    place: {
      vi: "UCLA, California, Hoa Kỳ và CERN, Thụy Sĩ",
      en: "UCLA, California, USA and CERN, Switzerland"
    },
    file: "posts/su-ra-doi-cua-internet.vi.md",
    lang: "vi",
    date: "2026-08-05",
    verified: true,
    files: {
      vi: "posts/su-ra-doi-cua-internet.vi.md",
      en: "posts/su-ra-doi-cua-internet.en.md"
    }
  }
];

for (const np of newPosts) {
  const idx = postsData.posts.findIndex(p => p.slug === np.slug);
  if (idx >= 0) postsData.posts[idx] = np;
  else postsData.posts.unshift(np); // Đưa lên đầu danh sách mới nhất
}

fs.writeFileSync(postsPath, JSON.stringify(postsData, null, 2) + '\n', 'utf8');
console.log(`✓ Đã cập nhật ${postsPath}: tổng số ${postsData.posts.length} bài viết.`);

// 2. Thêm 5 Nhân Vật vào figures/index.json
const figsPath = './figures/index.json';
const figsData = JSON.parse(fs.readFileSync(figsPath, 'utf8'));

const newFigures = [
  {
    slug: "dinh-tien-hoang",
    name: {
      vi: "Đinh Tiên Hoàng",
      en: "Dinh Tien Hoang"
    },
    role: {
      vi: "Hoàng đế khai sáng triều Đinh, người dẹp loạn 12 sứ quân",
      en: "Founding Emperor of the Dinh Dynasty, unifier of the realm"
    },
    field: {
      vi: "Chính trị, Quân sự",
      en: "Politics, Military"
    },
    born: "924",
    died: "979",
    era: {
      vi: "Trung đại",
      en: "Medieval"
    },
    region: "vietnam",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Statue_of_King_Dinh_Tien_Hoang.jpg/800px-Statue_of_King_Dinh_Tien_Hoang.jpg",
    credit: "Wikimedia Commons (CC BY-SA 3.0)",
    excerpt: {
      vi: "Vị hoàng đế dẹp yên loạn 12 sứ quân, xưng Hoàng đế và đặt quốc hiệu Đại Cồ Việt, mở nền chính thống độc lập cho dân tộc.",
      en: "The legendary emperor who suppressed the Twelve Warlords, proclaimed himself Emperor, and founded independent Dai Co Viet."
    },
    tags: ["Việt Nam", "Đinh Tiên Hoàng", "Hoa Lư", "quân sự", "vua chúa"],
    file: "figures/dinh-tien-hoang.vi.md",
    lang: "vi",
    files: {
      vi: "figures/dinh-tien-hoang.vi.md",
      en: "figures/dinh-tien-hoang.en.md"
    }
  },
  {
    slug: "ba-trieu",
    name: {
      vi: "Bà Triệu (Triệu Thị Trinh)",
      en: "Lady Trieu (Trieu Thi Trinh)"
    },
    role: {
      vi: "Nữ anh hùng dân tộc, thủ lĩnh khởi nghĩa chống Đông Ngô",
      en: "National heroine, leader of the anti-Eastern Wu uprising"
    },
    field: {
      vi: "Quân sự, Khởi nghĩa",
      en: "Military, Resistance"
    },
    born: "225",
    died: "248",
    era: {
      vi: "Cổ đại",
      en: "Ancient"
    },
    region: "vietnam",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Lady_Trieu.jpg/800px-Lady_Trieu.jpg",
    credit: "Tranh dân gian Đông Hồ — Wikimedia Commons (Public Domain)",
    excerpt: {
      vi: "Nữ tướng kiệt xuất cưỡi voi xung trận làm rung chuyển chính quyền đô hộ phương Bắc với chí khí đạp sóng biển Đông ngút trời.",
      en: "Fearless warrior who led elephant-mounted legions against foreign invaders with the immortal vow to ride the storm."
    },
    tags: ["Việt Nam", "Bà Triệu", "khởi nghĩa", "nữ anh hùng", "Bắc thuộc"],
    file: "figures/ba-trieu.vi.md",
    lang: "vi",
    files: {
      vi: "figures/ba-trieu.vi.md",
      en: "figures/ba-trieu.en.md"
    }
  },
  {
    slug: "isaac-newton",
    name: {
      vi: "Sir Isaac Newton",
      en: "Sir Isaac Newton"
    },
    role: {
      vi: "Nhà vật lý, toán học, thiên văn học lỗi lạc",
      en: "Physicist, mathematician, and astronomer"
    },
    field: {
      vi: "Vật lý học, Toán học, Thiên văn học",
      en: "Physics, Mathematics, Astronomy"
    },
    born: "1643",
    died: "1727",
    era: {
      vi: "Cận đại",
      en: "Early Modern"
    },
    region: "world",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/GodfreyKneller-IsaacNewton-1689.jpg/800px-GodfreyKneller-IsaacNewton-1689.jpg",
    credit: "Sir Godfrey Kneller — Wikimedia Commons (Public Domain)",
    excerpt: {
      vi: "Bộ óc vĩ đại khai sinh cơ học cổ điển với ba định luật chuyển động và lực hấp dẫn vũ trụ, kiến tạo nền móng khoa học hiện đại.",
      en: "One of the greatest minds in history, who formulated the laws of motion and universal gravitation, founding modern physics."
    },
    tags: ["Thế giới", "Newton", "vật lý", "khoa học", "toán học"],
    file: "figures/isaac-newton.vi.md",
    lang: "vi",
    files: {
      vi: "figures/isaac-newton.vi.md",
      en: "figures/isaac-newton.en.md"
    }
  },
  {
    slug: "alexander-dai-de",
    name: {
      vi: "Alexander Đại Đế",
      en: "Alexander the Great"
    },
    role: {
      vi: "Vua xứ Macedonia, nhà chinh phạt bách chiến bách thắng",
      en: "King of Macedonia, undefeated conqueror of the ancient world"
    },
    field: {
      vi: "Quân sự, Chính trị",
      en: "Military, Politics"
    },
    born: "356 TCN",
    died: "323 TCN",
    era: {
      vi: "Cổ đại",
      en: "Ancient"
    },
    region: "world",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Alexander_the_Great_mosaic_%28cropped%29.jpg/800px-Alexander_the_Great_mosaic_%28cropped%29.jpg",
    credit: "Wikimedia Commons (Public Domain)",
    excerpt: {
      vi: "Vị vua trẻ bất bại đã chinh phục Đế chế Ba Tư, mở mang cương thổ tới Ấn Độ và khai sinh Thời kỳ Hy Lạp hóa rực rỡ.",
      en: "The undefeated conqueror who overthrew the Persian Empire, expanded to India, and inaugurated the Hellenistic Era."
    },
    tags: ["Thế giới", "Alexander", "Macedonia", "Hy Lạp", "quân sự", "cổ đại"],
    file: "figures/alexander-dai-de.vi.md",
    lang: "vi",
    files: {
      vi: "figures/alexander-dai-de.vi.md",
      en: "figures/alexander-dai-de.en.md"
    }
  },
  {
    slug: "alan-turing",
    name: {
      vi: "Alan Turing",
      en: "Alan Turing"
    },
    role: {
      vi: "Cha đẻ của khoa học máy tính, nhà mật mã học giải mã Enigma",
      en: "Father of theoretical computer science, Enigma codebreaker"
    },
    field: {
      vi: "Khoa học máy tính, Toán học, Trí tuệ nhân tạo",
      en: "Computer Science, Mathematics, Artificial Intelligence"
    },
    born: "1912",
    died: "1954",
    era: {
      vi: "Hiện đại",
      en: "Contemporary"
    },
    region: "world",
    portrait: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/800px-Alan_Turing_Aged_16.jpg",
    credit: "Wikimedia Commons (Public Domain)",
    excerpt: {
      vi: "Thiên tài toán học phá giải mật mã Enigma cứu hàng triệu người, đề xuất Cỗ máy Turing và đặt nền móng cho Trí tuệ Nhân tạo.",
      en: "Genius codebreaker who cracked Enigma, conceived the Turing Machine, and laid the foundations of Artificial Intelligence."
    },
    tags: ["Thế giới", "Alan Turing", "máy tính", "Enigma", "AI", "Thế chiến II"],
    file: "figures/alan-turing.vi.md",
    lang: "vi",
    files: {
      vi: "figures/alan-turing.vi.md",
      en: "figures/alan-turing.en.md"
    }
  }
];

for (const nf of newFigures) {
  const idx = figsData.figures.findIndex(f => f.slug === nf.slug);
  if (idx >= 0) figsData.figures[idx] = nf;
  else figsData.figures.unshift(nf); // Đưa lên đầu
}

fs.writeFileSync(figsPath, JSON.stringify(figsData, null, 2) + '\n', 'utf8');
console.log(`✓ Đã cập nhật ${figsPath}: tổng số ${figsData.figures.length} nhân vật.`);
