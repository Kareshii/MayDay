ALTER TABLE articles ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS article_view_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  visitor_hash text NOT NULL,
  viewed_on text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS article_view_events_unique_idx
  ON article_view_events (article_id, visitor_hash, viewed_on);

CREATE INDEX IF NOT EXISTS article_view_events_article_idx
  ON article_view_events (article_id);

CREATE INDEX IF NOT EXISTS article_view_events_viewed_on_idx
  ON article_view_events (viewed_on);
