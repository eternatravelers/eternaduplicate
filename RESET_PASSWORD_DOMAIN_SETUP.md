# Konfigurasi Reset Password Domain Bolt

## Status Saat Ini
Reset password telah dikonfigurasi untuk menggunakan domain Bolt:
```
https://eternatravelers-eter-hx4y.bolt.host/
```

## Langkah yang Diperlukan di Supabase Dashboard

Untuk memastikan email reset password berfungsi dengan baik, Anda perlu menambahkan domain ini ke Supabase Dashboard:

### 1. Login ke Supabase Dashboard
- Buka https://app.supabase.com
- Pilih project Anda: `zsoiqtwnvxdomhcocajz`

### 2. Navigasi ke Authentication Settings
- Klik **Authentication** di sidebar
- Klik **URL Configuration**

### 3. Tambahkan Domain Bolt ke Redirect URLs
Dalam section "Redirect URLs (for OAuth and email actions)", tambahkan:
```
https://eternatravelers-eter-hx4y.bolt.host/
```

### 4. Set Site URL (Optional tapi Recommended)
Di section "Site URL", set ke:
```
https://eternatravelers-eter-hx4y.bolt.host/
```

### 5. Save Konfigurasi
Klik tombol Save/Update untuk menyimpan perubahan

## Verifikasi

Setelah konfigurasi selesai, test dengan:

1. Buka login page: `https://eternatravelers-eter-hx4y.bolt.host/`
2. Klik "Lupa Password?"
3. Masukkan email yang terdaftar
4. Cek email - seharusnya menerima email dengan subject "Reset your password for WisataManager"
5. Klik link dalam email
6. Link akan membawa Anda ke halaman reset password pada domain Bolt
7. Masukkan password baru dan submit

## Format Email yang Dikirim

Email reset password akan berisi link dengan format:
```
https://eternatravelers-eter-hx4y.bolt.host/#access_token=xxxxx&type=recovery&expires_in=3600
```

- `access_token`: Token untuk verifikasi
- `type=recovery`: Menunjukkan ini adalah password reset
- `expires_in=3600`: Token valid untuk 1 jam

## Troubleshooting

Jika email reset password tidak diterima:

1. **Check Spam Folder**: Email mungkin masuk ke spam
2. **Verify Email Address**: Pastikan email di database sudah benar
3. **Check Supabase Logs**: Buka Supabase Dashboard → Logs untuk melihat error details
4. **Verify Domain**: Pastikan domain sudah ditambahkan dengan benar (termasuk trailing slash)

## File yang Diubah

- `src/hooks/useAuth.ts`: Reset password redirect URL diubah dari `window.location.origin` menjadi domain Bolt yang spesifik
