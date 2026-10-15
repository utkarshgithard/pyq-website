# BEU PYQ

A full-stack previous-year question paper library for Bihar Engineering University students. Students can search and filter papers by branch, semester, title, and unique paper code. Admins can securely upload or remove PDF papers.

## Requirements

- Node.js 20.9 or later
- PostgreSQL 14 or later (or Supabase Postgres)
- Supabase account (for Supabase Storage) or local disk storage

## Local setup


## Contributors

The contributor list is available at `http://localhost:3000/contributors`. To add
someone, add an entry with their `studentName` and `collegeName` to
`src/lib/contributors.ts`.

## Supabase Storage Setup

To store PDFs in Supabase Storage:

1. Create a project on [Supabase](https://supabase.com).
2. Go to **Storage** in the Supabase Dashboard and create a new bucket named `pyq-papers` (or customize the name in `SUPABASE_STORAGE_BUCKET`).
   - You can leave the bucket private (the app server handles authenticated downloads and uploads).
3. Go to **Project Settings** -> **API**:
   - Copy the **Project URL** and set it as `SUPABASE_URL` in `.env`.
   - Copy the **service_role key** (secret) and set it as `SUPABASE_SERVICE_ROLE_KEY` in `.env`. The service role key allows your server-side API routes to upload and delete files without RLS interference.
4. *(Optional)* You can also use Supabase's hosted PostgreSQL database by copying the connection string from **Project Settings** -> **Database** into `DATABASE_URL`.

If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are not provided, the app will automatically fall back to storing files locally in `UPLOAD_DIR` (`./data/papers`).

## Admin setup

Admin credentials are saved directly in your Supabase database (`Admin` table) using salted bcrypt hashes.

- Initial admin is seeded using `npm run admin:seed`.
- Default username: `admin`, password: `123456789101112`.
- You can change your password anytime using the **Change password** button in the `/admin` web interface.
- Admin sessions are signed with `SESSION_SECRET`, stored in an HTTP-only same-site cookie, and expire after 12 hours.

Uploads accept PDF files up to 20 MB. Paper codes are unique. Removing a paper from the admin page removes its database record and stored file.
