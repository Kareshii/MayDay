ALTER TABLE articles ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS articles_pinned_idx ON articles (pinned);
