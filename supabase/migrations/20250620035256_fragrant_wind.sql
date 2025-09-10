/*
  # Travel Management System Database Schema

  1. New Tables
    - `destinations`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `location` (text, nullable)
      - `description` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `sales`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, nullable)
      - `phone` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `trips`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `destination_id` (uuid, foreign key to destinations)
      - `trip_type` (text, not null)
      - `departure_date` (date, not null)
      - `return_date` (date, not null)
      - `meeting_point` (text, not null)
      - `quota` (integer, default 0)
      - `price` (numeric, default 0)
      - `additional_facilities` (text, nullable)
      - `bus_number` (text, nullable)
      - `driver_name` (text, nullable)
      - `tour_leader` (text, nullable)
      - `status` (text, default 'active')
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `participants`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key to trips)
      - `sales_id` (uuid, foreign key to sales)
      - `full_name` (text, not null)
      - `email` (text, not null)
      - `phone` (text, not null)
      - `address` (text, not null)
      - `participant_count` (integer, default 1)
      - `package_price` (numeric, not null)
      - `dp_amount` (numeric, not null)
      - `dp_transfer_date` (date, not null)
      - `status` (text, default 'pending')
      - `additional_requests` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
    
    - `transactions`
      - `id` (uuid, primary key)
      - `transaction_date` (date, not null)
      - `transaction_type` (text, not null)
      - `category` (text, not null)
      - `amount` (numeric, default 0)
      - `description` (text, nullable)
      - `trip_id` (uuid, foreign key to trips)
      - `destination_id` (uuid, foreign key to destinations)
      - `trip_type` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Add policies for public read access where appropriate

  3. Indexes
    - Add indexes on foreign key columns for better performance
    - Add indexes on commonly queried columns
*/

-- Create destinations table
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  trip_type text NOT NULL,
  departure_date date NOT NULL,
  return_date date NOT NULL,
  meeting_point text NOT NULL,
  quota integer DEFAULT 0,
  price numeric DEFAULT 0,
  additional_facilities text,
  bus_number text,
  driver_name text,
  tour_leader text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  sales_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  participant_count integer DEFAULT 1,
  package_price numeric NOT NULL,
  dp_amount numeric NOT NULL,
  dp_transfer_date date NOT NULL,
  status text DEFAULT 'pending',
  additional_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL,
  transaction_type text NOT NULL,
  category text NOT NULL,
  amount numeric DEFAULT 0,
  description text,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  trip_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for destinations
CREATE POLICY "Allow public read access to destinations"
  ON destinations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage destinations"
  ON destinations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for sales
CREATE POLICY "Allow authenticated users to manage sales"
  ON sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for trips
CREATE POLICY "Allow public read access to trips"
  ON trips
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage trips"
  ON trips
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for participants
CREATE POLICY "Allow authenticated users to manage participants"
  ON participants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for transactions
CREATE POLICY "Allow authenticated users to manage transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_destination_id ON trips(destination_id);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_participants_trip_id ON participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_participants_sales_id ON participants(sales_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trip_id ON transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_transactions_destination_id ON transactions(destination_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_destinations_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();