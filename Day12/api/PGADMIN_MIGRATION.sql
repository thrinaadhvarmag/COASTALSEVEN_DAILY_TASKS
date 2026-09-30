-- Run this once in pgAdmin against the task_manager database.
-- It keeps existing projects intact and allows image_url to be NULL.

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
