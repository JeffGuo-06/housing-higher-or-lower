-- Clean slate: Drop everything first
DROP VIEW IF EXISTS property_stats;
DROP FUNCTION IF EXISTS get_random_property(CHAR);
DROP FUNCTION IF EXISTS get_property_pair(CHAR);
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TABLE IF EXISTS properties CASCADE;

-- Create properties table for storing US and Canadian property data
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Property identifiers
  mls_number VARCHAR(50),
  property_id VARCHAR(50),

  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  province VARCHAR(50),
  postal_code VARCHAR(20),
  country CHAR(2) NOT NULL CHECK (country IN ('US', 'CA')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Property details
  price INTEGER NOT NULL,
  bedrooms VARCHAR(20),  -- Can be "3", "3+1", etc.
  bathrooms VARCHAR(20), -- Can be "2", "2+1", etc.
  sqft INTEGER,
  lot_size VARCHAR(50),
  year_built INTEGER,
  property_type VARCHAR(100),

  -- URLs and media
  listing_url TEXT,
  image_url TEXT,
  image_url_med TEXT,
  image_url_low TEXT,
  local_image_path TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT price_positive CHECK (price > 0),
  CONSTRAINT sqft_positive CHECK (sqft > 0),
  CONSTRAINT year_built_valid CHECK (year_built >= 1600 AND year_built <= EXTRACT(YEAR FROM CURRENT_DATE) + 5),
  CONSTRAINT latitude_valid CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT longitude_valid CHECK (longitude >= -180 AND longitude <= 180)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_properties_country ON properties(country);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_province ON properties(province);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Create unique index on mls_number where not null (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_mls_number ON properties(mls_number) WHERE mls_number IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read properties (for public viewing)
CREATE POLICY "Allow public read access" ON properties
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert (using service role key from serverless functions)
-- This will be handled by your API endpoints with proper authentication
CREATE POLICY "Allow authenticated insert access" ON properties
  FOR INSERT
  WITH CHECK (true);

-- Create function to get random property by country
CREATE OR REPLACE FUNCTION get_random_property(property_country CHAR(2) DEFAULT 'US')
RETURNS TABLE (
  id UUID,
  mls_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  "province" VARCHAR(50),
  country CHAR(2),
  price INTEGER,
  bedrooms VARCHAR(20),
  bathrooms VARCHAR(20),
  sqft INTEGER,
  property_type VARCHAR(100),
  image_url TEXT,
  listing_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.mls_number,
    p.address,
    p.city,
    p.state,
    p.province,
    p.country,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.sqft,
    p.property_type,
    p.image_url,
    p.listing_url,
    p.latitude,
    p.longitude
  FROM properties p
  WHERE p.country = property_country
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get two random properties for comparison (Higher or Lower game)
CREATE OR REPLACE FUNCTION get_property_pair(property_country CHAR(2) DEFAULT 'US')
RETURNS TABLE (
  id UUID,
  mls_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  "province" VARCHAR(50),
  country CHAR(2),
  price INTEGER,
  bedrooms VARCHAR(20),
  bathrooms VARCHAR(20),
  sqft INTEGER,
  property_type VARCHAR(100),
  image_url TEXT,
  listing_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.mls_number,
    p.address,
    p.city,
    p.state,
    p.province,
    p.country,
    p.price,
    p.bedrooms,
    p.bathrooms,
    p.sqft,
    p.property_type,
    p.image_url,
    p.listing_url,
    p.latitude,
    p.longitude
  FROM properties p
  WHERE p.country = property_country
  ORDER BY RANDOM()
  LIMIT 2;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for property statistics by country
CREATE OR REPLACE VIEW property_stats AS
SELECT
  country,
  COUNT(*) as total_properties,
  AVG(price)::INTEGER as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM properties
GROUP BY country;
