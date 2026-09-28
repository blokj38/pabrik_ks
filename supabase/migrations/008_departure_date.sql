-- Explicit departure date for a delivery order, separate from created_at
-- (when the record was entered) since goods may actually leave on a
-- different day than when the surat jalan was drafted in the system.
alter table delivery_orders add column departure_date date default current_date;
