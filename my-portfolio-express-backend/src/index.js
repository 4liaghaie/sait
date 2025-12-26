import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { store } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');
const ADMIN_DIR = path.join(__dirname, '..', 'admin');
const SUPPORTED_LANGS = ['en', 'tr'];

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const safeName = file.originalname.replace(/[^\w.\-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });
const sessions = new Map();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/admin', express.static(ADMIN_DIR));

app.use((req, _res, next) => {
  const reqLang = (req.query.lang || '').toString().toLowerCase();
  const headerLang =
    reqLang ||
    (req.headers['accept-language'] || '').split(',')[0]?.split('-')[0];
  req.lang = SUPPORTED_LANGS.includes(headerLang) ? headerLang : 'en';
  next();
});

const pickLang = (translations = {}, lang = 'en') => {
  if (typeof translations === 'string') return translations;
  return translations[lang] || translations.en || translations.tr || '';
};

const buildMedia = (filePath, req) => {
  if (!filePath) return null;
  const baseUrl =
    process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = filePath.startsWith('http')
    ? filePath
    : `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  return {
    url,
    formats: { medium: { url } },
  };
};

const formatCategory = (cat, lang) => ({
  id: cat.id,
  Title: pickLang(cat.title, lang),
  Description: pickLang(cat.description, lang),
  position: cat.position ?? 0,
  is_active: !!cat.is_active,
  translations: {
    title: cat.title,
    description: cat.description,
  },
});

const formatImage = (img, lang, categories, references, req) => {
  const media = buildMedia(img.imagePath, req);
  const categoryObjs = (img.categoryIds || [])
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => formatCategory(c, lang));
  const referenceObjs = (img.referenceIds || [])
    .map((id) => references.find((r) => r.id === id))
    .filter(Boolean)
    .map((ref) => formatReference(ref, lang, req, true));

  return {
    id: img.id,
    documentId: img.id,
    Title: pickLang(img.title, lang),
    alt: pickLang(img.alt, lang),
    home: !!img.home,
    position: img.position ?? 0,
    image: media ? { ...media } : null,
    categories: categoryObjs,
    references: referenceObjs,
    translations: {
      title: img.title,
      alt: img.alt,
    },
  };
};

const formatReference = (ref, lang, req, skipImages = false, images = []) => ({
  id: ref.id,
  documentId: ref.id,
  title: pickLang(ref.title, lang),
  description: pickLang(ref.description, lang),
  year: ref.year || '',
  logo_light: buildMedia(ref.logoLightPath, req),
  logo_dark: buildMedia(ref.logoDarkPath, req),
  images: skipImages
    ? (ref.imageIds || []).map((id) => ({ documentId: id, id }))
    : (ref.imageIds || [])
        .map((id) => images.find((img) => img.id === id))
        .filter(Boolean)
        .map((img) => formatImage(img, lang, [], [], req)),
  translations: {
    title: ref.title,
    description: ref.description,
  },
});

const auth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (token && sessions.has(token)) {
    const session = sessions.get(token);
    if (session.expiresAt > Date.now()) {
      session.lastSeen = Date.now();
      return next();
    }
    sessions.delete(token);
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

const parseBool = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const v = val.toLowerCase();
    return v === 'true' || v === 'on' || v === '1' || v === 'yes';
  }
  return false;
};

const parseNumber = (val, fallback = 0) => {
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickQuery = (req, keys) => {
  for (const k of keys) {
    if (req.query?.[k] !== undefined) return req.query[k];
  }
  return undefined;
};

app.post('/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = crypto.randomUUID();
  sessions.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    lastSeen: Date.now(),
  });
  res.json({ token, expiresIn: 86400 });
});

app.get('/api/about', (req, res) => {
  const about = store.getAbout();
  res.json({
    data: {
      About_text: pickLang(
        { en: about.content_en, tr: about.content_tr },
        req.lang
      ),
      translations: { en: about.content_en, tr: about.content_tr },
      updatedAt: about.updated_at,
    },
  });
});

app.get('/api/logo', (req, res) => {
  const logo = store.getLogo();
  res.json({
    data: {
      id: logo.id,
      img: buildMedia(logo.img_path, req),
      alt: pickLang({ en: logo.alt_en, tr: logo.alt_tr }, req.lang),
      translations: { en: logo.alt_en, tr: logo.alt_tr },
    },
  });
});

app.get('/api/categories', (req, res) => {
  const categories = [...(store.listCategories() || [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0)
  );
  res.json({
    data: categories.map((cat) => formatCategory(cat, req.lang)),
  });
});

app.get('/api/references', (req, res) => {
  const refs = store.listReferences();
  res.json({
    data: refs.map((ref) => formatReference(ref, req.lang, req, true)),
  });
});

app.get('/api/images/:id', (req, res) => {
  const categories = store.listCategories();
  const references = store.listReferences();
  const image = store.getImage(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }
  res.json({
    data: formatImage(image, req.lang, categories, references, req),
  });
});

app.get('/api/images', (req, res) => {
  const categories = store.listCategories();
  const references = store.listReferences();
  let results = [...(store.listImages() || [])].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
  const filters = req.query.filters || {};
  const pagination = req.query.pagination || {};

  const homeFilter =
    filters?.home?.$eq ?? pickQuery(req, ['filters[home][$eq]']);
  if (homeFilter !== undefined) {
    const shouldBeHome = parseBool(homeFilter);
    results = results.filter((img) => !!img.home === shouldBeHome);
  }

  const categoryTitle =
    filters?.categories?.Title?.$eq ??
    pickQuery(req, ['filters[categories][Title][$eq]']);
  if (categoryTitle) {
    const matchingCategoryIds = (categories || [])
      .filter((cat) =>
        [pickLang(cat.title, 'en'), pickLang(cat.title, 'tr')].some(
          (value) =>
            value && value.toLowerCase() === categoryTitle.toLowerCase()
        )
      )
      .map((cat) => cat.id);
    results = results.filter((img) =>
      (img.categoryIds || []).some((id) => matchingCategoryIds.includes(id))
    );
  }

  const page = parseNumber(
    pagination.page ?? pickQuery(req, ['pagination[page]']) ?? 1,
    1
  );
  const pageSize = parseNumber(
    pagination.pageSize ??
      pickQuery(req, ['pagination[pageSize]']) ??
      (results.length || 1),
    25
  );
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize);

  res.json({
    data: paged.map((img) =>
      formatImage(img, req.lang, categories, references, req)
    ),
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(results.length / pageSize) || 1,
        total: results.length,
      },
    },
  });
});

app.put('/admin/about', auth, (req, res) => {
  const { en = '', tr = '' } = req.body?.translations || req.body || {};
  const about = store.updateAbout({ en, tr });
  res.json({ data: about });
});

app.post('/admin/logo', auth, upload.single('img'), (req, res) => {
  const { alt_en = '', alt_tr = '', remoteUrl } = req.body;
  if (!remoteUrl && !req.file) {
    return res.status(400).json({ error: 'Please provide a file or remote URL' });
  }
  const imagePath = remoteUrl
    ? remoteUrl
    : req.file
    ? `/uploads/${req.file.filename}`
    : store.getLogo().img_path;
  const logo = store.updateLogo({
    imgPath: imagePath,
    alt_en,
    alt_tr,
  });
  res.json({ data: logo });
});

app.post('/admin/categories', auth, (req, res) => {
  const { title = {}, description = {}, position = 0, is_active = true } =
    req.body || {};
  const category = store.createCategory({
    title: {
      en: title.en || '',
      tr: title.tr || '',
    },
    description: {
      en: description.en || '',
      tr: description.tr || '',
    },
    position: parseNumber(position, 0),
    is_active: parseBool(is_active),
  });
  res.status(201).json({ data: category });
});

app.patch('/admin/categories/:id', auth, (req, res) => {
  const category = store.updateCategory(req.params.id, {
    title: req.body?.title,
    description: req.body?.description,
    position:
      req.body?.position !== undefined
        ? parseNumber(req.body.position)
        : undefined,
    is_active:
      req.body?.is_active !== undefined
        ? parseBool(req.body.is_active)
        : undefined,
  });
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ data: category });
});

app.delete('/admin/categories/:id', auth, (req, res) => {
  store.deleteCategory(req.params.id);
  res.status(204).end();
});

app.post(
  '/admin/images',
  auth,
  upload.single('image'),
  (req, res) => {
    const {
      title_en = '',
      title_tr = '',
      alt_en = '',
      alt_tr = '',
      home = false,
      position = 0,
      categories = '',
      references = '',
      remoteUrl,
    } = req.body || {};

    // ensure checkbox false propagates
    const homeFlag = parseBool(home);

    const imagePath = remoteUrl
      ? remoteUrl
      : req.file
      ? `/uploads/${req.file.filename}`
      : '';

    const image = store.createImage({
      title: { en: title_en, tr: title_tr },
      alt: { en: alt_en, tr: alt_tr },
      home: homeFlag,
      position: parseNumber(position, 0),
      imagePath,
      categoryIds: categories
        ? categories.split(',').map((v) => v.trim()).filter(Boolean)
        : [],
      referenceIds: references
        ? references.split(',').map((v) => v.trim()).filter(Boolean)
        : [],
    });

    res.status(201).json({ data: image });
  }
);

app.patch(
  '/admin/images/:id',
  auth,
  upload.single('image'),
  (req, res) => {
    const existing = store.getImage(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Image not found' });

    const {
      title_en,
      title_tr,
      alt_en,
      alt_tr,
      home,
      position,
      categories,
      references,
      remoteUrl,
    } = req.body || {};

    const updated = store.updateImage(req.params.id, {
      title:
        title_en !== undefined || title_tr !== undefined
          ? {
              en: title_en ?? existing.title.en,
              tr: title_tr ?? existing.title.tr,
            }
          : undefined,
      alt:
        alt_en !== undefined || alt_tr !== undefined
          ? { en: alt_en ?? existing.alt.en, tr: alt_tr ?? existing.alt.tr }
          : undefined,
      home: home !== undefined ? parseBool(home) : undefined,
      position: position !== undefined ? parseNumber(position, 0) : undefined,
      categoryIds:
        categories !== undefined
          ? categories
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          : undefined,
      referenceIds:
        references !== undefined
          ? references
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          : undefined,
      imagePath:
        remoteUrl || req.file
          ? remoteUrl
            ? remoteUrl
            : `/uploads/${req.file.filename}`
          : undefined,
    });

    res.json({ data: updated });
  }
);

app.delete('/admin/images/:id', auth, (req, res) => {
  store.deleteImage(req.params.id);
  res.status(204).end();
});

app.post(
  '/admin/references',
  auth,
  upload.fields([
    { name: 'logo_light', maxCount: 1 },
    { name: 'logo_dark', maxCount: 1 },
  ]),
  (req, res) => {
    const {
      title_en = '',
      title_tr = '',
      description_en = '',
      description_tr = '',
      year = '',
      images = '',
      remoteLogoLight,
      remoteLogoDark,
    } = req.body || {};

    const logoLightPath = remoteLogoLight
      ? remoteLogoLight
      : req.files?.logo_light?.[0]
      ? `/uploads/${req.files.logo_light[0].filename}`
      : '';

    const logoDarkPath = remoteLogoDark
      ? remoteLogoDark
      : req.files?.logo_dark?.[0]
      ? `/uploads/${req.files.logo_dark[0].filename}`
      : '';

    const reference = store.createReference({
      title: { en: title_en, tr: title_tr },
      description: { en: description_en, tr: description_tr },
      year,
      logoLightPath,
      logoDarkPath,
      imageIds: images
        ? images.split(',').map((v) => v.trim()).filter(Boolean)
        : [],
    });

    res.status(201).json({ data: reference });
  }
);

app.patch(
  '/admin/references/:id',
  auth,
  upload.fields([
    { name: 'logo_light', maxCount: 1 },
    { name: 'logo_dark', maxCount: 1 },
  ]),
  (req, res) => {
    const existing = store.getReference(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Reference not found' });
    }

    const {
      title_en,
      title_tr,
      description_en,
      description_tr,
      year,
      images,
      remoteLogoLight,
      remoteLogoDark,
    } = req.body || {};

    const newLightPath =
      remoteLogoLight ||
      (req.files?.logo_light?.[0]
        ? `/uploads/${req.files.logo_light[0].filename}`
        : undefined);

    const newDarkPath =
      remoteLogoDark ||
      (req.files?.logo_dark?.[0]
        ? `/uploads/${req.files.logo_dark[0].filename}`
        : undefined);

    const updated = store.updateReference(req.params.id, {
      title:
        title_en !== undefined || title_tr !== undefined
          ? {
              en: title_en ?? existing.title.en,
              tr: title_tr ?? existing.title.tr,
            }
          : undefined,
      description:
        description_en !== undefined || description_tr !== undefined
          ? {
              en: description_en ?? existing.description.en,
              tr: description_tr ?? existing.description.tr,
            }
          : undefined,
      year: year !== undefined ? year : undefined,
      imageIds:
        images !== undefined
          ? images
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
          : undefined,
      logoLightPath: newLightPath !== undefined ? newLightPath : undefined,
      logoDarkPath: newDarkPath !== undefined ? newDarkPath : undefined,
    });

    res.json({ data: updated });
  }
);

app.delete('/admin/references/:id', auth, (req, res) => {
  store.deleteReference(req.params.id);
  res.status(204).end();
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Portfolio backend ready',
    docs: ['/admin', '/api/about', '/api/logo', '/api/categories', '/api/images', '/api/references'],
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
