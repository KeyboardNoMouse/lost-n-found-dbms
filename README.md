# NIE Lost & Found

A campus lost-and-found platform for the National Institute of Engineering, Mysore. Built with Next.js 16, MongoDB, NextAuth (Google OAuth), and Cloudinary.

## Features

- Browse lost/found items with search, category filters, and sort order
- Report items with image upload and campus location picker
- Claim items with a message — owner receives an email notification
- Owner dashboard (My History) to manage, edit, and track claims on your items
- Admin panel with analytics, item management, and audit logs
- Automatic item expiry after a configurable number of days (Vercel cron)
- Rate limiting on submissions and claims

## Quick Start

### 1. Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (free tier works)
- Google Cloud Console project with OAuth 2.0 credentials
- Cloudinary account (free tier works)

### 2. Clone and install

```bash
git clone <repo-url>
cd nielostnfound
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials |
| `CLOUDINARY_*` | Cloudinary Dashboard → API Keys |
| `ADMIN_EMAILS` | Comma-separated @nie.ac.in emails |
| `SMTP_*` | Your SMTP provider (see below) |
| `CRON_SECRET` | `openssl rand -base64 32` |

### 4. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application)
3. Add Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. In the OAuth consent screen, set **Allowed domains** to `nie.ac.in` so only NIE accounts can log in

### 5. Email notifications (optional)

Set `SMTP_*` variables in `.env.local`. The app works fine without them — notifications are silently skipped. Easy options:

- **[Resend](https://resend.com)** — free 3000 emails/month, excellent developer experience
- **[Brevo](https://brevo.com)** — free 300 emails/day
- **Gmail SMTP** — use an App Password if you have 2FA enabled

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test
```

Tests cover validation helpers and the rate limiter.

## Deploying to Vercel

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Add all environment variables from `.env.example` in Project Settings → Environment Variables
3. The `vercel.json` cron job runs `/api/cron/expire-items` daily at midnight UTC — it uses `CRON_SECRET` for auth

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Public dashboard
│   ├── add/page.tsx          # Report an item
│   ├── history/page.tsx      # User's own items + claims management
│   ├── admin/page.tsx        # Admin panel
│   └── api/
│       ├── items/            # GET (browse) / POST (create)
│       ├── items/[id]/       # PATCH (edit) / DELETE (soft-delete)
│       ├── claims/           # GET (owner view) / POST (submit claim)
│       ├── claims/[id]/      # PATCH (accept/reject)
│       ├── admin/            # Analytics + item management
│       └── cron/expire-items # Daily auto-expiry job
├── components/
│   ├── Navbar.tsx
│   ├── ItemCard.tsx          # Shared item card component
│   └── SessionWrapper.tsx
├── lib/
│   ├── mongodb.ts
│   ├── adminAuth.ts
│   ├── validation.ts         # Server-side input validation
│   ├── rateLimit.ts          # In-memory rate limiter
│   └── notify.ts             # Email notifications via SMTP
├── models/
│   ├── Item.ts
│   ├── Claim.ts
│   └── AdminLog.ts
└── types/
    └── index.ts              # Shared TypeScript types
```

## Improvements made (v0.1 → v0.2)

- **Security**: Removed PII (email/phone) from public API projection
- **Security**: Added MIME-type validation for image uploads
- **Feature**: Claim notifications — item owner receives an email when someone files a claim
- **Feature**: Accept/reject claims from the History page
- **Feature**: Sort items by newest or oldest
- **Feature**: Location is now a standardised campus-location dropdown
- **Feature**: Auto-expiry cron job marks stale items as expired
- **UX**: Image preview before upload
- **UX**: Pagination added to History page
- **UX**: Accessible aria labels and roles throughout
- **Code quality**: Shared `Item` type across pages (`src/types/index.ts`)
- **Code quality**: Shared `ItemCard` component
- **Code quality**: Replaced `error: any` with typed error handling
- **Tests**: Unit tests for validation and rate limiter (vitest)
- **Docs**: This README
