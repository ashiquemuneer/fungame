-- Add option_display_mode column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS option_display_mode text;
