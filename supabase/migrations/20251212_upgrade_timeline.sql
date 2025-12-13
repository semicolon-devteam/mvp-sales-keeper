-- Add status and metadata columns to timeline_posts
-- Status: 'active' (default), 'done' (processed), 'ignored'
-- Metadata: Store linked expense_id or ocr data

ALTER TABLE public.timeline_posts 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Optional: Add index for faster dashboard queries
CREATE INDEX IF NOT EXISTS idx_timeline_status ON public.timeline_posts(status);
