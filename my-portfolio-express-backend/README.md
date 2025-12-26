# Portfolio Express Backend (bilingual)

Node.js + Express replacement for the Strapi backend with English/Turkish content, Strapi-style public APIs, SQLite persistence, and a built-in admin panel.

## Quick start

1) `cd my-portfolio-express-backend`
2) Copy `.env.example` to `.env` and set `ADMIN_PASSWORD` (and `PORT` if needed).
3) `npm install`
4) `npm run dev`
5) Visit `http://localhost:4000/admin` to log in and manage content.

Uploads are saved to `uploads/` and content lives in `data/data.db` (SQLite, auto-created and seeded).

## Public API (Strapi-like shapes)

- `GET /api/about?lang=en|tr` → `{ data: { About_text, translations } }`
- `GET /api/logo` → `{ data: { img: { url, formats.medium.url }, alt } }`
- `GET /api/categories` → `{ data: [{ id, Title, position, Description, translations }] }`
- `GET /api/references` → `{ data: [{ id, title, description, year, logo_light, logo_dark, images:[{documentId}] }] }`
- `GET /api/images?populate=*&filters[home][$eq]=true&filters[categories][Title][$eq]=architecture&pagination[page]=1&pagination[pageSize]=25`
  - Responds with `{ data: [...], meta.pagination }`
- `GET /api/images/:id` → single image (same shape as list)

Strings honor `lang` (default `en`) and fall back between English/Turkish.

## Admin API (token auth)

1) `POST /admin/login { password }` → `{ token }`
2) Send `Authorization: Bearer <token>` for protected routes:
   - `PUT /admin/about { translations: { en, tr } }`
   - `POST /admin/logo` (multipart) `img` or `remoteUrl`, `alt_en`, `alt_tr`
   - `POST/PATCH/DELETE /admin/categories/:id`
   - `POST/PATCH/DELETE /admin/images/:id` (multipart) with `image` or `remoteUrl`, `home`, `BW`, `position`, `categories` (comma-separated IDs), `references` (comma-separated IDs), optional `width`/`height`
   - `POST/PATCH/DELETE /admin/references/:id` (multipart) with logos and `images` (comma-separated image IDs)

The admin UI (`/admin`) wraps these endpoints for quick editing.

## Frontend hookup

Point the Next.js frontend to this server (e.g., `http://localhost:4000`) instead of the Strapi URL. The responses keep the flat field names used by the existing React components (`Title`, `position`, `home`, `logo_light`, etc.) plus bilingual `translations` blocks for the admin.
