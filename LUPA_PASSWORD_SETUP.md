# Panduan Fitur Lupa Password

Fitur lupa password sudah berhasil ditambahkan ke sistem WisataManager.

## Cara Kerja

1. **User Meminta Reset Password**
   - User klik link "Lupa Password?" di halaman login
   - Masukkan email yang terdaftar
   - Klik "Kirim Link Reset Password"
   - Email akan dikirim ke inbox user

2. **User Menerima Email**
   - Supabase akan mengirim email berisi link reset password
   - Link berlaku untuk waktu tertentu (default: 1 jam)

3. **User Reset Password**
   - User klik link di email
   - Akan diarahkan ke halaman reset password
   - Masukkan password baru (minimal 6 karakter)
   - Konfirmasi password baru
   - Klik "Ubah Password"
   - Password berhasil diubah, diarahkan kembali ke halaman login

## Konfigurasi Supabase yang Diperlukan

### 1. Email Templates (Opsional - Supabase sudah punya default)

Anda bisa menyesuaikan template email di Supabase Dashboard:

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Masuk ke **Authentication** → **Email Templates**
4. Pilih template "Reset Password"
5. Sesuaikan template sesuai kebutuhan

Template default sudah baik, tapi Anda bisa mengubah:
- Judul email
- Konten pesan
- Styling email

### 2. SMTP Configuration

Untuk production, disarankan menggunakan SMTP provider sendiri:

1. Buka **Project Settings** → **Auth** → **SMTP Settings**
2. Pilih provider email (misalnya: SendGrid, Mailgun, AWS SES, dll)
3. Masukkan kredensial SMTP Anda
4. Test pengiriman email

Untuk development, Supabase menggunakan built-in email system dengan batasan:
- Rate limiting: beberapa email per jam
- Cocok untuk testing saja

### 3. Email Confirmation Settings

Pastikan email confirmation dinonaktifkan atau dikonfigurasi dengan benar:

1. Buka **Authentication** → **Providers** → **Email**
2. Pastikan "Confirm email" dinonaktifkan (unchecked)
   - Atau jika diaktifkan, pastikan user sudah konfirmasi email mereka

## Testing

### Test Flow Lengkap:

1. **Test Request Reset Password**
   ```
   - Masuk ke halaman login
   - Klik "Lupa Password?"
   - Masukkan email yang valid
   - Cek inbox email
   ```

2. **Test Email Delivery**
   ```
   - Pastikan email diterima (cek spam folder juga)
   - Verifikasi link valid
   - Link format: https://yourdomain.com#access_token=...&type=recovery
   ```

3. **Test Reset Password**
   ```
   - Klik link di email
   - Masukkan password baru
   - Konfirmasi password
   - Submit form
   - Login dengan password baru
   ```

## Troubleshooting

### Email Tidak Diterima

**Penyebab:**
- Rate limiting dari Supabase
- Email masuk ke spam folder
- SMTP configuration salah
- Email tidak terdaftar di sistem

**Solusi:**
- Cek spam/junk folder
- Tunggu beberapa menit (rate limiting)
- Verifikasi SMTP settings di Supabase
- Pastikan email sudah terdaftar di user_profiles

### Link Reset Tidak Valid

**Penyebab:**
- Link sudah kadaluarsa (> 1 jam)
- Link sudah pernah digunakan
- Token tidak valid

**Solusi:**
- Request link reset password baru
- Pastikan menggunakan link terbaru yang dikirim

### Password Tidak Bisa Diubah

**Penyebab:**
- Password terlalu pendek (< 6 karakter)
- Konfirmasi password tidak cocok
- Session tidak valid

**Solusi:**
- Gunakan password minimal 6 karakter
- Pastikan kedua field password sama
- Request link reset password baru jika session sudah kadaluarsa

## Security Notes

- Link reset password hanya valid untuk 1 jam (default Supabase)
- Link hanya bisa digunakan sekali
- Password minimal 6 karakter (bisa diubah di Supabase)
- User harus login ulang setelah reset password
- Tidak ada notifikasi ke email lama saat password diubah (bisa ditambahkan jika perlu)

## Files yang Ditambahkan/Diubah

### Files Baru:
- `/src/components/Auth/ResetPasswordPage.tsx` - Halaman reset password

### Files yang Diubah:
- `/src/App.tsx` - Menambahkan routing untuk reset password
- `/src/hooks/useAuth.ts` - Sudah ada fungsi resetPassword
- `/src/components/Auth/LoginForm.tsx` - Sudah ada UI lupa password

## Rekomendasi untuk Production

1. **Setup SMTP Provider**
   - Gunakan SendGrid, Mailgun, atau AWS SES
   - Jangan andalkan built-in Supabase email untuk production

2. **Customize Email Template**
   - Sesuaikan branding dengan perusahaan Anda
   - Tambahkan logo perusahaan
   - Gunakan bahasa Indonesia penuh

3. **Strengthen Password Policy**
   - Tambahkan requirement: huruf besar, angka, karakter spesial
   - Minimal 8-10 karakter
   - Bisa diatur di Supabase Auth settings

4. **Add Security Notifications**
   - Kirim notifikasi ke email saat password berhasil diubah
   - Log aktivitas reset password
   - Tambahkan captcha jika perlu

5. **Monitor dan Logging**
   - Monitor rate limit penggunaan
   - Track failed reset attempts
   - Alert jika ada suspicious activity
