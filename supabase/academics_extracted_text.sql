-- Add extracted text for Academics study agent (Phase 3).
-- Run if academic_materials already exists without this column.

alter table public.academic_materials
  add column if not exists extracted_text text not null default '';
