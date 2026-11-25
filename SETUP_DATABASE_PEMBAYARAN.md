# Setup Database + Pembayaran Agenda (Supabase + Midtrans)

## 1. Pasang pustaka
    pnpm add @supabase/supabase-js

## 2. Supabase
1. Buat proyek di supabase.com.
2. Buka **SQL Editor**, tempel isi `supabase/schema.sql`, lalu **Run**.
3. Salin `.env.example` menjadi `.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
   (Project Settings > API).
4. Authentication > Providers: pastikan **Email** aktif. Untuk tombol Google, aktifkan **Google**
   dan isi Client ID/Secret dari Google Cloud Console. Tambahkan URL aplikasimu di
   Authentication > URL Configuration.
5. Saat pengembangan, matikan "Confirm email" (Authentication > Providers > Email) bila ingin
   langsung bisa masuk setelah daftar.

## 3. Midtrans (sandbox)
1. Daftar di dashboard.sandbox.midtrans.com, buka Settings > Access Keys.
2. Isi `VITE_MIDTRANS_CLIENT_KEY` di `.env` (Client Key saja).
3. Deploy Edge Function (butuh Supabase CLI):

       supabase login
       supabase link --project-ref <PROJECT_REF>
       supabase secrets set MIDTRANS_SERVER_KEY=<SERVER_KEY_SANDBOX> MIDTRANS_IS_PRODUCTION=false
       supabase functions deploy create-transaction
       supabase functions deploy midtrans-webhook --no-verify-jwt

   Server Key hanya disimpan sebagai secret di Supabase, tidak pernah masuk kode frontend.
4. Di Midtrans: Settings > Payment > Notification URL, isi
   `https://<PROJECT_REF>.supabase.co/functions/v1/midtrans-webhook`.

## 4. Coba
    pnpm dev
Daftar akun, buka Toko > "Beli pakai uang" atau tombol Langganan Premium, lalu bayar memakai
simulator sandbox Midtrans. Status premium/item muncul setelah webhook diterima.

## Catatan penting
- Harga ada di `supabase/functions/_shared/catalog.ts` dan harus sama dengan harga di aplikasi.
- Premium dan item hasil pembayaran diberikan server (webhook), tidak bisa diubah dari browser.
- Poin, streak, dan pembelian dengan poin masih dihitung di browser (bisa dimanipulasi lewat
  DevTools). Langkah berikutnya: pindahkan logika poin ke fungsi SQL/Edge Function.
- Mode produksi Midtrans butuh verifikasi akun/bisnis; ganti ke key produksi,
  `MIDTRANS_IS_PRODUCTION=true`, dan `VITE_MIDTRANS_SNAP_URL=https://app.midtrans.com/snap/snap.js`.
