-- Controls the order business units appear when a surat jalan spans more
-- than one (print preview, Word, PDF), instead of whatever order the items
-- happened to be entered in. Best-effort defaults are set below by name
-- match for the 3 units already in use; adjust via Master Data > Unit
-- Usaha if a name doesn't match.
alter table business_units add column sort_order integer not null default 0;

update business_units set sort_order = 1 where name ilike '%obor emas%';
update business_units set sort_order = 2 where name ilike '%kecap%';
update business_units set sort_order = 3 where name ilike '%kerupuk%' or name ilike '%mie%';
