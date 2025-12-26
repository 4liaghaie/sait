import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'data.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS about (
    id TEXT PRIMARY KEY CHECK (id = 'about'),
    content_en TEXT DEFAULT '',
    content_tr TEXT DEFAULT '',
    updated_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );
  INSERT OR IGNORE INTO about(id, content_en, content_tr, updated_at) VALUES ('about', '', '', strftime('%s','now')*1000);

  CREATE TABLE IF NOT EXISTS logo (
    id TEXT PRIMARY KEY CHECK (id = 'logo'),
    img_path TEXT DEFAULT '',
    alt_en TEXT DEFAULT '',
    alt_tr TEXT DEFAULT '',
    updated_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );
  INSERT OR IGNORE INTO logo(id, img_path, alt_en, alt_tr, updated_at) VALUES ('logo', '', '', '', strftime('%s','now')*1000);

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    title_en TEXT DEFAULT '',
    title_tr TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    description_tr TEXT DEFAULT '',
    position INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    title_en TEXT DEFAULT '',
    title_tr TEXT DEFAULT '',
    alt_en TEXT DEFAULT '',
    alt_tr TEXT DEFAULT '',
    home INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    image_path TEXT DEFAULT ''
    ,created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS image_categories (
    image_id TEXT,
    category_id TEXT
  );

  CREATE TABLE IF NOT EXISTS reference_items (
    id TEXT PRIMARY KEY,
    title_en TEXT DEFAULT '',
    title_tr TEXT DEFAULT '',
    description_en TEXT DEFAULT '',
    description_tr TEXT DEFAULT '',
    year TEXT DEFAULT '',
    logo_light_path TEXT DEFAULT '',
    logo_dark_path TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS reference_images (
    reference_id TEXT,
    image_id TEXT
  );
`);

// migrate created_at column for images if missing
try {
  db.prepare(`ALTER TABLE images ADD COLUMN created_at INTEGER DEFAULT (strftime('%s','now') * 1000)`).run();
} catch (err) {
  // ignore if exists
}

const seedIfEmpty = () => {
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (count > 0) return;

  const now = Date.now();
  db.prepare(
    `UPDATE about SET content_en=?, content_tr=?, updated_at=? WHERE id='about'`
  ).run(
    '<p>Welcome to your bilingual portfolio backend. Use the admin panel to replace this copy with your own story.</p>',
    '<p>Çift dilli portföy backend\'inize hoş geldiniz. Bu metni kendi hikayenizle değiştirmek için yönetim panelini kullanın.</p>',
    now
  );
  db.prepare(
    `UPDATE logo SET alt_en=?, alt_tr=?, updated_at=? WHERE id='logo'`
  ).run('Portfolio logo', 'Portföy logosu', now);

  const catStmt = db.prepare(
    `INSERT INTO categories(id, title_en, title_tr, description_en, description_tr, position, is_active)
     VALUES (@id, @title_en, @title_tr, @description_en, @description_tr, @position, @is_active)`
  );
  catStmt.run({
    id: 'cat-architecture',
    title_en: 'architecture',
    title_tr: 'mimari',
    description_en: 'Built environments',
    description_tr: 'Yapılı çevreler',
    position: 1,
    is_active: 1,
  });
  catStmt.run({
    id: 'cat-portrait',
    title_en: 'portraits',
    title_tr: 'portreler',
    description_en: 'Character driven frames',
    description_tr: 'Karakter odaklı kareler',
    position: 2,
    is_active: 1,
  });

  const imgStmt = db.prepare(
    `INSERT INTO images (id, title_en, title_tr, alt_en, alt_tr, home, position, image_path)
     VALUES (@id,@title_en,@title_tr,@alt_en,@alt_tr,@home,@position,@image_path)`
  );
  imgStmt.run({
    id: 'img-sample-1',
    title_en: 'Sunlit lines',
    title_tr: 'Güneşli çizgiler',
    alt_en: 'Architecture study',
    alt_tr: 'Mimari çalışması',
    home: 1,
    position: 1,
    image_path:
      'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80',
  });
  imgStmt.run({
    id: 'img-sample-2',
    title_en: 'Soft portrait',
    title_tr: 'Yumuşak portre',
    alt_en: 'Portrait study',
    alt_tr: 'Portre çalışması',
    home: 1,
    position: 2,
    image_path:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  });

  db.prepare(
    `INSERT INTO image_categories(image_id, category_id) VALUES ('img-sample-1','cat-architecture'), ('img-sample-2','cat-portrait')`
  ).run();

  const refStmt = db.prepare(
    `INSERT INTO reference_items(id, title_en, title_tr, description_en, description_tr, year, logo_light_path, logo_dark_path)
     VALUES (@id,@title_en,@title_tr,@description_en,@description_tr,@year,@logo_light_path,@logo_dark_path)`
  );
  refStmt.run({
    id: 'ref-sample',
    title_en: 'Sample brand',
    title_tr: 'Örnek marka',
    description_en: 'Demo reference entry. Replace via admin.',
    description_tr: 'Demo referans kaydı. Yönetim panelinden değiştirin.',
    year: '2024',
    logo_light_path: '',
    logo_dark_path: '',
  });
  db.prepare(
    `INSERT INTO reference_images(reference_id, image_id) VALUES ('ref-sample','img-sample-2')`
  ).run();
};

seedIfEmpty();

const rowToCategory = (row) => ({
  id: row.id,
  title: { en: row.title_en || '', tr: row.title_tr || '' },
  description: { en: row.description_en || '', tr: row.description_tr || '' },
  position: row.position ?? 0,
  is_active: !!row.is_active,
});

const rowToImage = (row) => ({
  id: row.id,
  title: { en: row.title_en || '', tr: row.title_tr || '' },
  alt: { en: row.alt_en || '', tr: row.alt_tr || '' },
  home: !!row.home,
  position: row.position ?? 0,
  imagePath: row.image_path || '',
  createdAt: row.created_at || Date.now(),
  categoryIds: row.categoryIds || [],
  referenceIds: row.referenceIds || [],
});

const rowToReference = (row) => ({
  id: row.id,
  title: { en: row.title_en || '', tr: row.title_tr || '' },
  description: { en: row.description_en || '', tr: row.description_tr || '' },
  year: row.year || '',
  logoLightPath: row.logo_light_path || '',
  logoDarkPath: row.logo_dark_path || '',
  imageIds: row.imageIds || [],
});

export const store = {
  getAbout() {
    return db.prepare(`SELECT * FROM about WHERE id='about'`).get();
  },
  updateAbout({ en, tr }) {
    db.prepare(
      `UPDATE about SET content_en=?, content_tr=?, updated_at=? WHERE id='about'`
    ).run(en || '', tr || '', Date.now());
    return this.getAbout();
  },
  getLogo() {
    return db.prepare(`SELECT * FROM logo WHERE id='logo'`).get();
  },
  updateLogo({ imgPath, alt_en = '', alt_tr = '' }) {
    db.prepare(
      `UPDATE logo SET img_path=?, alt_en=?, alt_tr=?, updated_at=? WHERE id='logo'`
    ).run(imgPath || '', alt_en, alt_tr, Date.now());
    return this.getLogo();
  },
  listCategories() {
    return db
      .prepare(
        `SELECT id, title_en, title_tr, description_en, description_tr, position, is_active FROM categories`
      )
      .all()
      .map(rowToCategory);
  },
  createCategory(data) {
    const id = data.id || crypto.randomUUID();
    db.prepare(
      `INSERT INTO categories(id,title_en,title_tr,description_en,description_tr,position,is_active)
       VALUES (@id,@title_en,@title_tr,@description_en,@description_tr,@position,@is_active)`
    ).run({
      id,
      title_en: data.title?.en || '',
      title_tr: data.title?.tr || '',
      description_en: data.description?.en || '',
      description_tr: data.description?.tr || '',
      position: data.position ?? 0,
      is_active: data.is_active ? 1 : 0,
    });
    return this.getCategory(id);
  },
  getCategory(id) {
    const row = db
      .prepare(
        `SELECT id, title_en, title_tr, description_en, description_tr, position, is_active FROM categories WHERE id=?`
      )
      .get(id);
    return row ? rowToCategory(row) : null;
  },
  updateCategory(id, data) {
    const existing = this.getCategory(id);
    if (!existing) return null;
    db.prepare(
      `UPDATE categories SET
        title_en=@title_en, title_tr=@title_tr,
        description_en=@description_en, description_tr=@description_tr,
        position=@position, is_active=@is_active
       WHERE id=@id`
    ).run({
      id,
      title_en: data.title?.en ?? existing.title.en,
      title_tr: data.title?.tr ?? existing.title.tr,
      description_en: data.description?.en ?? existing.description.en,
      description_tr: data.description?.tr ?? existing.description.tr,
      position: data.position ?? existing.position ?? 0,
      is_active:
        data.is_active === undefined
          ? existing.is_active
          : data.is_active
          ? 1
          : 0,
    });
    return this.getCategory(id);
  },
  deleteCategory(id) {
    db.prepare(`DELETE FROM image_categories WHERE category_id=?`).run(id);
    db.prepare(`DELETE FROM categories WHERE id=?`).run(id);
  },
  listImages() {
    const rows = db
      .prepare(
        `SELECT id, title_en, title_tr, alt_en, alt_tr, home, position, image_path, created_at FROM images ORDER BY created_at DESC`
      )
      .all();
    return rows.map((row) => {
      const cats = db
        .prepare(`SELECT category_id FROM image_categories WHERE image_id=?`)
        .all(row.id)
        .map((c) => c.category_id);
      const refs = db
        .prepare(`SELECT reference_id FROM reference_images WHERE image_id=?`)
        .all(row.id)
        .map((r) => r.reference_id);
      return rowToImage({ ...row, categoryIds: cats, referenceIds: refs });
    });
  },
  getImage(id) {
    const row = db
      .prepare(
        `SELECT id, title_en, title_tr, alt_en, alt_tr, home, position, image_path, created_at FROM images WHERE id=?`
      )
      .get(id);
    if (!row) return null;
    const cats = db
      .prepare(`SELECT category_id FROM image_categories WHERE image_id=?`)
      .all(id)
      .map((c) => c.category_id);
    const refs = db
      .prepare(`SELECT reference_id FROM reference_images WHERE image_id=?`)
      .all(id)
      .map((r) => r.reference_id);
    return rowToImage({ ...row, categoryIds: cats, referenceIds: refs });
  },
  createImage(data) {
    const id = data.id || crypto.randomUUID();
    db.prepare(
      `INSERT INTO images(id,title_en,title_tr,alt_en,alt_tr,home,position,image_path,created_at)
       VALUES (@id,@title_en,@title_tr,@alt_en,@alt_tr,@home,@position,@image_path,@created_at)`
    ).run({
      id,
      title_en: data.title?.en || '',
      title_tr: data.title?.tr || '',
      alt_en: data.alt?.en || '',
      alt_tr: data.alt?.tr || '',
      home: data.home ? 1 : 0,
      position: data.position ?? 0,
      image_path: data.imagePath || '',
      created_at: data.createdAt ?? Date.now(),
    });
    db.prepare(`DELETE FROM image_categories WHERE image_id=?`).run(id);
    (data.categoryIds || []).forEach((catId) => {
      db.prepare(
        `INSERT INTO image_categories(image_id, category_id) VALUES (?,?)`
      ).run(id, catId);
    });
    db.prepare(`DELETE FROM reference_images WHERE image_id=?`).run(id);
    (data.referenceIds || []).forEach((refId) => {
      db.prepare(
        `INSERT INTO reference_images(reference_id, image_id) VALUES (?,?)`
      ).run(refId, id);
    });
    return this.getImage(id);
  },
  updateImage(id, data) {
    const existing = this.getImage(id);
    if (!existing) return null;
    db.prepare(
      `UPDATE images SET
        title_en=@title_en, title_tr=@title_tr,
        alt_en=@alt_en, alt_tr=@alt_tr,
        home=@home, position=@position,
        image_path=@image_path
       WHERE id=@id`
    ).run({
      id,
      title_en: data.title?.en ?? existing.title.en,
      title_tr: data.title?.tr ?? existing.title.tr,
      alt_en: data.alt?.en ?? existing.alt.en,
      alt_tr: data.alt?.tr ?? existing.alt.tr,
      home: data.home === undefined ? (existing.home ? 1 : 0) : data.home ? 1 : 0,
      position: data.position ?? existing.position ?? 0,
      image_path: data.imagePath ?? existing.imagePath,
    });

    if (data.categoryIds) {
      db.prepare(`DELETE FROM image_categories WHERE image_id=?`).run(id);
      (data.categoryIds || []).forEach((catId) => {
        db.prepare(
          `INSERT INTO image_categories(image_id, category_id) VALUES (?,?)`
        ).run(id, catId);
      });
    }
    if (data.referenceIds) {
      db.prepare(`DELETE FROM reference_images WHERE image_id=?`).run(id);
      (data.referenceIds || []).forEach((refId) => {
        db.prepare(
          `INSERT INTO reference_images(reference_id, image_id) VALUES (?,?)`
        ).run(refId, id);
      });
    }
    return this.getImage(id);
  },
  deleteImage(id) {
    db.prepare(`DELETE FROM reference_images WHERE image_id=?`).run(id);
    db.prepare(`DELETE FROM image_categories WHERE image_id=?`).run(id);
    db.prepare(`DELETE FROM images WHERE id=?`).run(id);
  },
  listReferences() {
    const rows = db
      .prepare(
        `SELECT id, title_en, title_tr, description_en, description_tr, year, logo_light_path, logo_dark_path FROM reference_items`
      )
      .all();
    return rows.map((row) => {
      const images = db
        .prepare(`SELECT image_id FROM reference_images WHERE reference_id=?`)
        .all(row.id)
        .map((i) => i.image_id);
      return rowToReference({ ...row, imageIds: images });
    });
  },
  getReference(id) {
    const row = db
      .prepare(
        `SELECT id, title_en, title_tr, description_en, description_tr, year, logo_light_path, logo_dark_path FROM reference_items WHERE id=?`
      )
      .get(id);
    if (!row) return null;
    const images = db
      .prepare(`SELECT image_id FROM reference_images WHERE reference_id=?`)
      .all(id)
      .map((i) => i.image_id);
    return rowToReference({ ...row, imageIds: images });
  },
  createReference(data) {
    const id = data.id || crypto.randomUUID();
    db.prepare(
      `INSERT INTO reference_items(id,title_en,title_tr,description_en,description_tr,year,logo_light_path,logo_dark_path)
       VALUES (@id,@title_en,@title_tr,@description_en,@description_tr,@year,@logo_light_path,@logo_dark_path)`
    ).run({
      id,
      title_en: data.title?.en || '',
      title_tr: data.title?.tr || '',
      description_en: data.description?.en || '',
      description_tr: data.description?.tr || '',
      year: data.year || '',
      logo_light_path: data.logoLightPath || '',
      logo_dark_path: data.logoDarkPath || '',
    });
    db.prepare(`DELETE FROM reference_images WHERE reference_id=?`).run(id);
    (data.imageIds || []).forEach((imgId) => {
      db.prepare(
        `INSERT INTO reference_images(reference_id, image_id) VALUES (?,?)`
      ).run(id, imgId);
    });
    return this.getReference(id);
  },
  updateReference(id, data) {
    const existing = this.getReference(id);
    if (!existing) return null;
    db.prepare(
      `UPDATE reference_items SET
        title_en=@title_en, title_tr=@title_tr,
        description_en=@description_en, description_tr=@description_tr,
        year=@year, logo_light_path=@logo_light_path, logo_dark_path=@logo_dark_path
       WHERE id=@id`
    ).run({
      id,
      title_en: data.title?.en ?? existing.title.en,
      title_tr: data.title?.tr ?? existing.title.tr,
      description_en: data.description?.en ?? existing.description.en,
      description_tr: data.description?.tr ?? existing.description.tr,
      year: data.year ?? existing.year ?? '',
      logo_light_path: data.logoLightPath ?? existing.logoLightPath,
      logo_dark_path: data.logoDarkPath ?? existing.logoDarkPath,
    });
    if (data.imageIds) {
      db.prepare(`DELETE FROM reference_images WHERE reference_id=?`).run(id);
      (data.imageIds || []).forEach((imgId) => {
        db.prepare(
          `INSERT INTO reference_images(reference_id, image_id) VALUES (?,?)`
        ).run(id, imgId);
      });
    }
    return this.getReference(id);
  },
  deleteReference(id) {
    db.prepare(`DELETE FROM reference_images WHERE reference_id=?`).run(id);
    db.prepare(`DELETE FROM reference_items WHERE id=?`).run(id);
  },
};
