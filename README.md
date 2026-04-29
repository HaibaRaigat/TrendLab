# 🚀 TrendLab — Excel Skills Reels Platform

A TikTok-inspired vertical video platform for Excel trainees of the **BMO Program at ISTA NTIC Guelmim**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎬 Explore Feed | TikTok-style vertical scroll, auto-play, swipe navigation |
| ❤️ Like System | One like per device (fingerprinting + localStorage) |
| 📤 Upload | Video upload with channel creation, trend selection |
| 🔥 Trends | Weekly trend challenges managed by admin |
| 🗂️ Archives | Past trends archived and browsable by likes |
| 🔐 Admin Panel | Secret code entry, hashed server-side verification |
| ☁️ Firebase | Firestore + Storage backend |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Firebase (Firestore + Storage)
- **Device ID**: FingerprintJS
- **Deployment**: Vercel

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-repo/trendlab
cd trendlab
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (e.g., `trendlab-bmo`)
3. Enable **Firestore Database** (start in test mode, then apply rules)
4. Enable **Storage**
5. Go to **Project Settings → Your apps → Web app** → Copy config

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# SHA-256 hash of your admin code — NEVER put the plain code here
ADMIN_CODE_HASH=aa13d3834a4d5f4dda27a937972d9917bebc39e1e368df9279084e69ec9b6018
```

> ⚠️ The hash above corresponds to code `0678820548`. If you change the code, update this hash.
> Generate a new hash: `echo -n "YOURCODE" | sha256sum`

### 4. Apply Firebase Rules

In Firebase Console:

**Firestore Rules** → Paste contents of `firestore.rules`

**Storage Rules** → Paste contents of `storage.rules`

### 5. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## 📦 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard or:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add ADMIN_CODE_HASH
# ... (repeat for all env vars)

# Redeploy with env vars
vercel --prod
```

**Or deploy via GitHub:**
1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add environment variables in project settings
4. Deploy!

---

## 🔐 Admin Access

The admin panel is accessible at:
```
https://your-domain.com/admin
```

This URL is **not linked anywhere** in the app. Enter the 10-digit code to access.

**Security measures:**
- Code is never stored in frontend JS
- SHA-256 hashed comparison happens server-side only
- Rate limiting: 3 failed attempts triggers lockout
- Session via httpOnly cookie (8h expiry)
- Progressive lockout increases with each failed attempt

---

## 📁 Project Structure

```
trendlab/
├── app/
│   ├── page.tsx              # Explore / main feed
│   ├── upload/page.tsx       # Upload page
│   ├── archives/page.tsx     # Trend archives
│   ├── admin/page.tsx        # Admin panel (hidden)
│   ├── api/
│   │   ├── verify-admin/     # Admin auth endpoint
│   │   └── like/             # Like rate limiting
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ReelsContainer.tsx    # Infinite scroll feed
│   ├── VideoReel.tsx         # Single reel with controls
│   ├── LikeButton.tsx        # Like with fingerprint
│   ├── UploadModal.tsx       # 3-step upload flow
│   ├── AdminPanel.tsx        # Full admin interface
│   ├── Navigation.tsx        # Bottom nav bar
│   └── SkeletonReel.tsx      # Loading skeleton
├── lib/
│   ├── firebase.ts           # Firebase setup
│   ├── fingerprint.ts        # Device ID + like storage
│   └── utils.ts              # Helpers
├── types/
│   └── index.ts              # TypeScript types + students list
├── firestore.rules
└── storage.rules
```

---

## 🗄️ Firestore Collections

| Collection | Fields |
|---|---|
| `videos` | videoURL, likes, channelId, trendId, trendTag, description, duration, archived, archiveId, timestamp |
| `channels` | name, profileImageURL, members[], type, createdAt |
| `trends` | tag, weekLabel, active, createdAt |
| `archives` | trendId, trendTag, weekLabel, videoIds[], createdAt |
| `videos/{id}/likes` | fingerprint, timestamp |

---

## 🔥 Admin Workflow

1. **Create a Trend**: Go to `/admin` → Trends tab → Enter tag name → Create
2. **Students Upload**: Students visit `/upload` and upload their Excel skill videos, selecting the active trend
3. **End of Week**: Admin goes to Archives tab → Click Archive on the trend
4. **Browse Archives**: Anyone can view past weeks at `/archives`

---

## 📱 Mobile Optimization

- `100dvh` viewport units for proper mobile height
- `scroll-snap` for smooth TikTok-style swiping
- `playsInline` + `muted` for iOS autoplay
- `safe-area-inset` for iPhone notch/home bar
- Touch-optimized tap targets (min 44px)
- `-webkit-tap-highlight-color: transparent`

---

## 🎨 Design System

```css
--primary: #49A546      /* Excel green */
--primary-dark: #1B6121 /* Deep forest green */
--surface: #0a0a0a      /* Near black background */
--surface-2: #111111    /* Card background */
--surface-3: #1a1a1a    /* Input background */
```

Font: **Poppins** (Google Fonts)

---

## 📋 Students List

The `STUDENTS_LIST` in `types/index.ts` contains 90 sample student names. Replace these with the actual BMO trainee list.

---

## 🐛 Troubleshooting

**Videos not loading**: Check Firebase Storage CORS settings. Add your domain to allowed origins.

**Like not persisting**: Ensure Firestore rules allow the likes sub-collection write.

**Admin code not working**: Double-check the SHA-256 hash in your env var matches `echo -n "0678820548" | sha256sum`.

**Autoplay blocked**: Users must interact with the page first on some browsers. The muted autoplay should work on most mobile browsers.

---

## 📄 License

Built for **ISTA NTIC Guelmim — BMO Excel Program** 🇲🇦
