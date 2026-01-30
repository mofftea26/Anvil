-- Program Templates: difficulty enum and state column (run only if not already present)
-- Table: public."programTemplates"

-- 1) Create difficulty enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'anvil_program_difficulty') THEN
    CREATE TYPE anvil_program_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
  END IF;
END
$$;

-- 2) Add difficulty column if not exists (default 'beginner')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'programTemplates' AND column_name = 'difficulty'
  ) THEN
    ALTER TABLE public."programTemplates"
    ADD COLUMN difficulty anvil_program_difficulty NOT NULL DEFAULT 'beginner';
  END IF;
END
$$;

-- 3) Add state column if not exists (versioned jsonb)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'programTemplates' AND column_name = 'state'
  ) THEN
    ALTER TABLE public."programTemplates"
    ADD COLUMN state jsonb NOT NULL DEFAULT '{"version":1,"weeks":[]}'::jsonb;
  END IF;
END
$$;

-- If your table name is snake_case (program_templates), use:
-- ALTER TABLE public.program_templates ADD COLUMN ...
-- and reference table_name = 'program_templates' in the IF checks.
