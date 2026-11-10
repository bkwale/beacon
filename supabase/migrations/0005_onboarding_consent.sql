-- Beacon — guided onboarding + consent (BCN-16, BCN-17, BCN-18)
-- Adds consent capture and an optional emergency note to profiles.
-- Additive and idempotent; existing profiles keep NULLs and are unaffected.

alter table public.profiles
  add column if not exists consent_at timestamptz,
  add column if not exists consent_version text,
  add column if not exists emergency_note text;

comment on column public.profiles.consent_at is
  'When the user accepted the data-sharing consent during onboarding (BCN-16).';
comment on column public.profiles.consent_version is
  'Version string of the consent copy the user agreed to.';
comment on column public.profiles.emergency_note is
  'Optional free-text note shown to the circle in an emergency (blood type, allergies, etc).';
