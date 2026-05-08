DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('queued', 'processing', 'done', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DROP TABLE IF EXISTS jobs;

CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  status job_status NOT NULL,
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  result TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  -- Enforce that progress is ONLY populated when the job is processing
  CONSTRAINT progress_rule CHECK (
    (status = 'processing' AND progress IS NOT NULL) OR
    (status != 'processing' AND progress IS NULL)
  )
);


alter publication supabase_realtime add table jobs;
