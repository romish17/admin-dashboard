-- AdminDashboard - Database Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create full-text search configuration for French and English
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'french_english') THEN
    CREATE TEXT SEARCH CONFIGURATION french_english (COPY = french);
  END IF;
END $$;

-- Grant permissions (if needed for additional users)
-- GRANT ALL PRIVILEGES ON DATABASE admindash TO admindash;

-- Note: The actual schema is managed by Prisma migrations
-- This file is for any additional database setup not handled by Prisma

-- Create indexes for full-text search (these will be added after Prisma creates tables)
-- The triggers below will auto-update search vectors

-- Example: Function to update search vector for scripts
-- CREATE OR REPLACE FUNCTION scripts_search_vector_update() RETURNS trigger AS $$
-- BEGIN
--   NEW.search_vector :=
--     setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
--     setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
--     setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER scripts_search_vector_trigger
-- BEFORE INSERT OR UPDATE ON scripts
-- FOR EACH ROW EXECUTE FUNCTION scripts_search_vector_update();

SELECT 'Database initialized successfully' as status;
