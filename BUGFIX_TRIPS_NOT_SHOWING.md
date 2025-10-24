# SOLUSI: Trips Tidak Muncul di Manajemen Perjalanan dan Operasional

## Masalah
Setelah menambahkan Meeting Point Operations, daftar trips hilang/tidak muncul di:
- Halaman Manajemen Perjalanan
- Halaman Operasional (Trip Monitoring)
- Meeting Point Operations

## Penyebab
RLS (Row Level Security) policy untuk tabel `trips` terlalu ketat. Policy menggunakan kondisi yang mengharuskan user memiliki role `admin` atau `super_admin` untuk SELECT (view), padahal seharusnya semua authenticated user dapat melihat trips.

## Solusi

Jalankan migration SQL berikut di Supabase Dashboard atau melalui MCP tools:

```sql
/*
  # Fix Trips SELECT Policy

  1. Changes
    - Drop existing restrictive policy for trips management
    - Create separate policies for SELECT (read) and write operations (INSERT, UPDATE, DELETE)
    - SELECT: Allow all authenticated users to view trips
    - INSERT/UPDATE/DELETE: Only admin and super_admin

  2. Security
    - Maintains RLS protection
    - Allows all authenticated users to view trips (necessary for operations and trip pages)
    - Restricts modifications to admin and super_admin only
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Allow authenticated users to manage trips" ON trips;
DROP POLICY IF EXISTS "Allow public read access to trips" ON trips;

-- Create separate SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for INSERT
CREATE POLICY "Admins can create trips"
  ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Create policy for UPDATE
CREATE POLICY "Admins can update trips"
  ON trips
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Create policy for DELETE
CREATE POLICY "Admins can delete trips"
  ON trips
  FOR DELETE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));
```

## Cara Menjalankan Migrasi

### Menggunakan Supabase Dashboard:
1. Buka Supabase Dashboard project Anda
2. Pergi ke menu **SQL Editor**
3. Copy-paste SQL di atas
4. Klik **Run**

### Menggunakan MCP Tools (jika tersedia):
Gunakan tool `mcp__supabase__apply_migration` dengan filename: `fix_trips_select_policy_v2`

## Verifikasi

Setelah menjalankan migration, cek apakah policy sudah benar:

```sql
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'trips'
ORDER BY cmd, policyname;
```

Hasilnya seharusnya:
- **SELECT**: `Authenticated users can view trips` dengan `qual = true`
- **INSERT**: `Admins can create trips` dengan role check
- **UPDATE**: `Admins can update trips` dengan role check
- **DELETE**: `Admins can delete trips` dengan role check

## Cek Status Data

Verifikasi trips yang ada di database:

```sql
SELECT
  id,
  name,
  status,
  departure_date,
  return_date
FROM trips
WHERE status IN ('active', 'completed', 'cancelled', 'draft')
ORDER BY departure_date DESC;
```

## Notes
- Migration ini tidak mengubah data, hanya RLS policies
- Keamanan tetap terjaga karena hanya admin yang bisa create/update/delete
- Semua authenticated users dapat view trips (diperlukan untuk operasional)
- Setelah migration, refresh halaman aplikasi Anda
