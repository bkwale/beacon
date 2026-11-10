-- Beacon — SOS test mode (BCN-37)
-- Adds a `test` flag to incidents so an SOS drill runs the full flow
-- without alarming real contacts. Safe/idempotent; defaults false so
-- every existing incident stays a real one.

alter table public.incidents
  add column if not exists test boolean not null default false;

comment on column public.incidents.test is
  'True when the incident was raised via SOS test mode (a drill). Real alerts are suppressed and the UI badges it TEST.';
