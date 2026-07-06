CREATE TABLE IF NOT EXISTS admin_navigation (
  id text PRIMARY KEY,
  title text NOT NULL,
  path text NOT NULL,
  link_type text NOT NULL,
  parent_id text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_comments (
  id text PRIMARY KEY,
  author text NOT NULL,
  email text NOT NULL DEFAULT '',
  article_slug text NOT NULL DEFAULT '',
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_friend_links (
  id text PRIMARY KEY,
  title text NOT NULL,
  url text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_navigation_order_idx ON admin_navigation (sort_order);
CREATE INDEX IF NOT EXISTS admin_navigation_parent_idx ON admin_navigation (parent_id);
ALTER TABLE admin_navigation ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'internal';
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'admin_navigation' AND column_name = 'type'
  ) THEN
    EXECUTE 'UPDATE admin_navigation SET link_type = COALESCE(NULLIF("type", ''''), link_type)';
    EXECUTE 'ALTER TABLE admin_navigation DROP COLUMN "type"';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS admin_categories_slug_idx ON admin_categories (slug);
CREATE INDEX IF NOT EXISTS admin_categories_parent_idx ON admin_categories (parent_id);
CREATE INDEX IF NOT EXISTS admin_categories_order_idx ON admin_categories (sort_order);
CREATE INDEX IF NOT EXISTS admin_comments_status_idx ON admin_comments (status);
CREATE INDEX IF NOT EXISTS admin_comments_article_slug_idx ON admin_comments (article_slug);
CREATE INDEX IF NOT EXISTS admin_comments_created_at_idx ON admin_comments (created_at);
CREATE INDEX IF NOT EXISTS admin_friend_links_order_idx ON admin_friend_links (sort_order);
CREATE INDEX IF NOT EXISTS admin_friend_links_enabled_idx ON admin_friend_links (enabled);
