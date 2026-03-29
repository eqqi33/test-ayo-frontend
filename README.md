# Football Manager Frontend

Frontend Next.js untuk sistem manajemen tim sepak bola amatir **Perusahaan XYZ**.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Toast | React Hot Toast |
| Runtime | Node.js 18+ |

## Fitur

- **Autentikasi** — Login, register, logout dengan JWT
- **Manajemen Tim** — CRUD tim (nama, logo, tahun berdiri, markas)
- **Manajemen Pemain** — CRUD pemain per tim (posisi, nomor punggung, TB/BB)
- **Jadwal Pertandingan** — Buat, edit, hapus jadwal; filter by status
- **Laporan Hasil** — Input skor, pencetak gol beserta menit; koreksi hasil
- **Laporan Lengkap** — Status akhir, top scorer, akumulasi kemenangan home/away
- **Dashboard** — Ringkasan statistik + pertandingan & laporan terbaru

## Cara Menjalankan

### 1. Setup environment

```bash
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_BASE_URL sesuai alamat server Go API
```

### 2. Install dependencies

```bash
npm install
```

### 3. Development

```bash
npm run dev
# Buka http://localhost:3000
```

### 4. Build untuk production

```bash
npm run build
npm start
```

## Konfigurasi Server (Deploy)

Ubah `NEXT_PUBLIC_API_BASE_URL` di `.env.local` (atau environment server) ke URL API production:

```
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
```

Pastikan backend mengatur `ALLOWED_ORIGIN` ke URL frontend production.

## Struktur Proyek

```
src/
├── app/
│   ├── dashboard/          # Halaman dashboard
│   ├── login/              # Login
│   ├── register/           # Register admin
│   ├── teams/
│   │   ├── page.tsx        # Daftar tim + CRUD
│   │   └── [id]/page.tsx   # Detail tim + manajemen pemain
│   ├── matches/
│   │   ├── page.tsx        # Jadwal pertandingan
│   │   └── [id]/page.tsx   # Detail + laporkan hasil
│   └── reports/
│       ├── page.tsx        # Semua laporan
│       └── [id]/page.tsx   # Detail laporan per pertandingan
├── components/             # Komponen reusable
├── contexts/               # AuthContext (JWT)
├── lib/
│   └── api.ts              # API client (fetch wrapper)
└── types/
    └── index.ts            # TypeScript types
```
