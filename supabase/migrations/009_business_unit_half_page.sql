-- Flags a business unit's surat jalan as printing on half a physical sheet
-- (for continuous 3-ply dot-matrix paper pre-split into two form slots),
-- so the Word export can size that unit's page at half height instead of
-- a full sheet.
alter table business_units add column half_page boolean not null default false;
