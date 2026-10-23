CREATE TABLE IF NOT EXISTS supermarkets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  city VARCHAR(80) NOT NULL,
  api_key_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supermarket_id UUID NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(500),
  discount_percent SMALLINT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT offer_dates_make_sense CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS offers_active_dates_idx ON offers (starts_at, ends_at);
CREATE INDEX IF NOT EXISTS offers_supermarket_idx ON offers (supermarket_id);
CREATE INDEX IF NOT EXISTS supermarkets_city_idx ON supermarkets (city);
