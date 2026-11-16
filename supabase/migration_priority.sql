-- ========================================================
-- DO-DAILY: ADD PRIORITY COLUMN TO TASKS TABLE
-- Run this in Supabase SQL Editor
-- ========================================================

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS priority public.task_priority NOT NULL DEFAULT 'medium';

-- Create index for filtering by priority
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

