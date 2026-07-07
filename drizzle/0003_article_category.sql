ALTER TABLE articles ADD COLUMN IF NOT EXISTS category_id text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS articles_category_id_idx ON articles (category_id);
