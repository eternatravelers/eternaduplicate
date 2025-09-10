/*
  # Add transaction categories management

  1. New Tables
    - `transaction_categories`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `type` (text, required) - 'Pemasukan' or 'Pengeluaran'
      - `parent_id` (uuid, nullable) - for sub-categories
      - `description` (text, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `transaction_categories` table
    - Add policies for authenticated users to manage categories

  3. Performance
    - Add indexes for better lookups
*/

-- Create transaction_categories table
CREATE TABLE IF NOT EXISTS transaction_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
  parent_id uuid REFERENCES transaction_categories(id) ON DELETE CASCADE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction_categories
CREATE POLICY "Allow authenticated users to manage transaction_categories"
  ON transaction_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_categories_type ON transaction_categories(type);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_parent_id ON transaction_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_active ON transaction_categories(is_active);

-- Add trigger to update updated_at column
CREATE TRIGGER update_transaction_categories_updated_at
  BEFORE UPDATE ON transaction_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO transaction_categories (name, type, description) VALUES
-- Pemasukan categories
('Pembayaran DP', 'Pemasukan', 'Down payment dari peserta'),
('Pelunasan', 'Pemasukan', 'Pembayaran lunas dari peserta'),
('Biaya Tambahan', 'Pemasukan', 'Biaya tambahan seperti asuransi, upgrade, dll'),
('Lain-lain', 'Pemasukan', 'Pemasukan lainnya'),

-- Pengeluaran categories
('Transportasi', 'Pengeluaran', 'Biaya transportasi utama'),
('BBM', 'Pengeluaran', 'Bahan bakar minyak'),
('Driver', 'Pengeluaran', 'Fee driver dan crew'),
('Konsumsi', 'Pengeluaran', 'Makanan dan minuman'),
('Tiket Masuk', 'Pengeluaran', 'Tiket masuk tempat wisata'),
('Akomodasi', 'Pengeluaran', 'Hotel, penginapan, homestay'),
('Dokumentasi', 'Pengeluaran', 'Foto, video, dokumentasi trip'),
('Tour Leader', 'Pengeluaran', 'Fee tour leader dan guide'),
('Operasional', 'Pengeluaran', 'Biaya operasional lainnya'),
('Lain-lain', 'Pengeluaran', 'Pengeluaran lainnya');

-- Insert some sub-categories as examples
INSERT INTO transaction_categories (name, type, parent_id, description) 
SELECT 
  'Bus AC', 
  'Pengeluaran', 
  id, 
  'Sewa bus ber-AC'
FROM transaction_categories 
WHERE name = 'Transportasi' AND type = 'Pengeluaran';

INSERT INTO transaction_categories (name, type, parent_id, description) 
SELECT 
  'Kapal Ferry', 
  'Pengeluaran', 
  id, 
  'Tiket kapal ferry'
FROM transaction_categories 
WHERE name = 'Transportasi' AND type = 'Pengeluaran';

INSERT INTO transaction_categories (name, type, parent_id, description) 
SELECT 
  'Makan Siang', 
  'Pengeluaran', 
  id, 
  'Makan siang peserta'
FROM transaction_categories 
WHERE name = 'Konsumsi' AND type = 'Pengeluaran';

INSERT INTO transaction_categories (name, type, parent_id, description) 
SELECT 
  'Snack & Minuman', 
  'Pengeluaran', 
  id, 
  'Snack dan minuman selama perjalanan'
FROM transaction_categories 
WHERE name = 'Konsumsi' AND type = 'Pengeluaran';