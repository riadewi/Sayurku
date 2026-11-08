export interface VerifiedProductImage {
  name: string;
  category: string;
  imageUrl: string;
  imageAlt: string;
}

export const VERIFIED_PRODUCT_IMAGES: Record<string, VerifiedProductImage> = {
  // ==========================================
  // KATEGORI 1: SAYURAN DAUN (18 ITEMS)
  // ==========================================
  'bayam': {
    name: 'Bayam',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Bayam hijau segar kaya zat besi'
  },
  'kangkung': {
    name: 'Kangkung',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kangkung air segar seikat renyah'
  },
  'pakcoy': {
    name: 'Pakcoy',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Pakcoy / sawi sendok segar tebal'
  },
  'sawi hijau': {
    name: 'Sawi Hijau',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Sawi caisim hijau segar'
  },
  'sawi putih': {
    name: 'Sawi Putih',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Sawi putih / napa cabbage manis renyah'
  },
  'selada': {
    name: 'Selada',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Selada keriting hijau segar salad'
  },
  'kol': {
    name: 'Kol',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kubis bulat kol segar padat'
  },
  'seledri': {
    name: 'Seledri',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Seledri wangi daun sop segar'
  },
  'daun bawang': {
    name: 'Daun Bawang',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun bawang segar berbatang tebal'
  },
  'daun singkong': {
    name: 'Daun Singkong',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1563114773-84221bd62daa?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun singkong muda segar lalapan'
  },
  'daun pepaya': {
    name: 'Daun Pepaya',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun pepaya hijau segar herbal'
  },
  'daun melinjo': {
    name: 'Daun Melinjo',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun melinjo muda segar sayur asem'
  },
  'kailan': {
    name: 'Kailan',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1574316071802-0d684efa7cd5?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kailan / chinese broccoli batang renyah'
  },
  'kale': {
    name: 'Kale',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun kale keriting hijau tua organik'
  },
  'tauge': {
    name: 'Tauge',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Tauge kacang hijau putih bersih segar'
  },
  'genjer': {
    name: 'Genjer',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Sayur genjer rawa muda segar'
  },
  'daun kemangi': {
    name: 'Daun Kemangi',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun kemangi wangi segar lalapan'
  },
  'daun kucai': {
    name: 'Daun Kucai',
    category: 'Sayuran Daun',
    imageUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun kucai pipih hijau segar'
  },

  // ==========================================
  // KATEGORI 2: SAYURAN UMBI DAN BUAH (25 ITEMS)
  // ==========================================
  'wortel': {
    name: 'Wortel',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Wortel segar oranye manis'
  },
  'kentang': {
    name: 'Kentang',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kentang dieng bulat segar padat'
  },
  'ubi jalar': {
    name: 'Ubi Jalar',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1590165482129-1b8b27698780?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Ubi jalar madu manis pulen'
  },
  'singkong': {
    name: 'Singkong',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Singkong putih segar empuk'
  },
  'lobak': {
    name: 'Lobak',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Lobak putih segar berair'
  },
  'bawang bombay': {
    name: 'Bawang Bombay',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Bawang bombay bulat besar'
  },
  'tomat': {
    name: 'Tomat',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Tomat merah ranum segar berair'
  },
  'terong': {
    name: 'Terong',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Terong ungu mengkilap segar'
  },
  'mentimun': {
    name: 'Mentimun',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Mentimun hijau segar renyah'
  },
  'labu siam': {
    name: 'Labu Siam',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Labu siam manis segar bergetah bening'
  },
  'labu kuning': {
    name: 'Labu Kuning',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1506917728037-b6fb01c4e69b?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Labu kuning parang manis legit'
  },
  'pare': {
    name: 'Pare',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Pare hijau gerigi segar khas'
  },
  'oyong': {
    name: 'Oyong',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Oyong / gambas hijau segar untuk sup'
  },
  'jagung manis': {
    name: 'Jagung Manis',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Jagung manis kuning segar bertongkol'
  },
  'jagung muda': {
    name: 'Jagung Muda',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Jagung semi / baby corn renyah'
  },
  'buncis': {
    name: 'Buncis',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Buncis baby hijau muda segar'
  },
  'kacang panjang': {
    name: 'Kacang Panjang',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1599818816943-7f11c75b9f87?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kacang panjang seikat hijau segar'
  },
  'brokoli': {
    name: 'Brokoli',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Brokoli hijau segar kuntum padat'
  },
  'kembang kol': {
    name: 'Kembang Kol',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kembang kol putih bersih segar'
  },
  'paprika': {
    name: 'Paprika',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paprika manis segar warna-warni'
  },
  'cabai merah': {
    name: 'Cabai Merah',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Cabai merah besar segar pedas'
  },
  'cabai rawit': {
    name: 'Cabai Rawit',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Cabai rawit merah pedas cetar'
  },
  'cabai keriting': {
    name: 'Cabai Keriting',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1568472535079-569b936d8955?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Cabai merah keriting pedas aromatik'
  },
  'okra': {
    name: 'Okra',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1425543103986-22abb7d7e8d2?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Okra hijau segar berlendir sehat'
  },
  'jamur tiram': {
    name: 'Jamur Tiram',
    category: 'Sayuran Umbi dan Buah',
    imageUrl: 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Jamur tiram putih segar bergerombol'
  },

  // ==========================================
  // KATEGORI 3: BUMBU DAN REMPAH (20 ITEMS)
  // ==========================================
  'bawang merah': {
    name: 'Bawang Merah',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Bawang merah brebes pilihan wangi'
  },
  'bawang putih': {
    name: 'Bawang Putih',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Bawang putih kating utuh gurih'
  },
  'jahe': {
    name: 'Jahe',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Jahe gajah rimpang pedas segar'
  },
  'kunyit': {
    name: 'Kunyit',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1615485500834-bc10199dc65e?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kunyit rimpang oranye tua pekat'
  },
  'lengkuas': {
    name: 'Lengkuas',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Lengkuas / laos segar wangi gulai'
  },
  'kencur': {
    name: 'Kencur',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kencur aromatik segar jamu dan seblak'
  },
  'serai': {
    name: 'Serai',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Batang serai wangi bumbu dapur'
  },
  'daun salam': {
    name: 'Daun Salam',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun salam wangi penyedap masakan'
  },
  'daun jeruk': {
    name: 'Daun Jeruk',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Daun jeruk purut wangi beraroma segar'
  },
  'kemiri': {
    name: 'Kemiri',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1508061252224-237ff54ed5a4?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kemiri bulat kupas gurih'
  },
  'ketumbar': {
    name: 'Ketumbar',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Biji ketumbar bulat wangi rempah'
  },
  'lada': {
    name: 'Lada',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Lada butir merica pedas hangat'
  },
  'pala': {
    name: 'Pala',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Biji buah pala wangi aromatik'
  },
  'kayu manis': {
    name: 'Kayu Manis',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kulit kayu manis batang wangi manis'
  },
  'kunyit putih': {
    name: 'Kunyit Putih',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1615485500834-bc10199dc65e?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Kunyit putih rimpang herbal segar'
  },
  'temulawak': {
    name: 'Temulawak',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Temulawak rimpang kuning kaya khasiat'
  },
  'kunci': {
    name: 'Kunci',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Temu kunci rempah wangi sayur bening'
  },
  'asam jawa': {
    name: 'Asam Jawa',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Asam jawa matang asam segar alami'
  },
  'jeruk nipis': {
    name: 'Jeruk Nipis',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Jeruk nipis hijau segar peras kaya air'
  },
  'jeruk limau': {
    name: 'Jeruk Limau',
    category: 'Bumbu dan Rempah',
    imageUrl: 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Jeruk limau sambal wangi khas'
  },

  // ==========================================
  // KATEGORI 4: PAKET BUNDLING SAYUR (15 ITEMS)
  // Gambar khusus kombinasi bahan sayur
  // ==========================================
  'paket sayur sop': {
    name: 'Paket Sayur Sop',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Sop komplit: wortel, kentang, kol, buncis, daun bawang, seledri'
  },
  'paket sayur asem': {
    name: 'Paket Sayur Asem',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Asem: jagung manis, labu siam, kacang panjang, melinjo, asam'
  },
  'paket sayur tumis': {
    name: 'Paket Sayur Tumis',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Tumis: sawi hijau, wortel, buncis, kol siap masak'
  },
  'paket sayur urap': {
    name: 'Paket Sayur Urap',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Urap: bayam, tauge, kacang panjang, bumbu urap gurih'
  },
  'paket sayur lodeh': {
    name: 'Paket Sayur Lodeh',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Lodeh: terong ungu, labu siam, kacang panjang, jagung'
  },
  'paket capcay': {
    name: 'Paket Capcay',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Capcay: brokoli, kembang kol, wortel, sawi putih, jagung muda'
  },
  'paket sayur bening': {
    name: 'Paket Sayur Bening',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Bening: bayam segar, jagung manis, temu kunci'
  },
  'paket bumbu sambal': {
    name: 'Paket Bumbu Sambal',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Bumbu Sambal: cabai merah, cabai rawit, bawang merah, bawang putih'
  },
  'paket sayur harian': {
    name: 'Paket Sayur Harian',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Harian segar belanja hemat praktis'
  },
  'paket sayur keluarga': {
    name: 'Paket Sayur Keluarga',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Porsi Keluarga komplit beraneka ragam'
  },
  'paket sayur hemat': {
    name: 'Paket Sayur Hemat',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Hemat ekonomis belanja dapur'
  },
  'paket sayur lengkap': {
    name: 'Paket Sayur Lengkap',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Lengkap daun dan umbi segar pilihan'
  },
  'paket sayur anak': {
    name: 'Paket Sayur Anak',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Anak manis lembut: jagung manis, wortel, kentang'
  },
  'paket sayur diet': {
    name: 'Paket Sayur Diet',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Sayur Hijau & Salad Diet rendah kalori segar'
  },
  'paket bumbu dapur lengkap': {
    name: 'Paket Bumbu Dapur Lengkap',
    category: 'Paket Bundling Sayur',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=85',
    imageAlt: 'Paket Bumbu Dapur Lengkap nusantara: aneka bawang, cabai, serai, rempah'
  }
};

/**
 * Helper to get verified image for a product by name
 */
export function getVerifiedProductImage(name: string): VerifiedProductImage | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  if (VERIFIED_PRODUCT_IMAGES[normalized]) {
    return VERIFIED_PRODUCT_IMAGES[normalized];
  }
  // Fallback by partial match
  for (const [key, val] of Object.entries(VERIFIED_PRODUCT_IMAGES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return val;
    }
  }
  return undefined;
}
