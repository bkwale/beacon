-- Beacon — Stage 1 RLS hardening (PRV)
-- Closes the broad SELECT=true policies and the invite-acceptance hole.
-- Safe to re-run (idempotent).

-- ---------------------------------------------------------------------------
-- Helper: is the current user an operator? (reused across incident policies)
-- ---------------------------------------------------------------------------
create or replace function public.is_operator()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.operator_roles where user_id = auth.uid());
$$;
revoke all on function public.is_operator() from public;
grant execute on function public.is_operator() to authenticated;

-- ---------------------------------------------------------------------------
-- profiles: self + accepted circle (+ operators). Invite preview no longer
-- needs this (it uses the invite's denormalised owner_name).
-- ---------------------------------------------------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read_self_or_circle on public.profiles
for select to authenticated using (
  id = auth.uid()
  or public.is_operator()
  or exists (
    select 1 from public.memberships m
    where m.status = 'accepted'
      and ( (m.owner_id = profiles.id   and m.contact_id = auth.uid())
         or (m.contact_id = profiles.id and m.owner_id   = auth.uid()) )
  )
);

-- ---------------------------------------------------------------------------
-- memberships: only the two parties (+ operators)
-- ---------------------------------------------------------------------------
drop policy if exists memberships_read on public.memberships;
create policy memberships_read_own on public.memberships
for select to authenticated using (
  owner_id = auth.uid() or contact_id = auth.uid() or public.is_operator()
);

-- ---------------------------------------------------------------------------
-- incidents: owner + accepted contacts of the owner + operators
-- ---------------------------------------------------------------------------
drop policy if exists incidents_read on public.incidents;
create policy incidents_read_party on public.incidents
for select to authenticated using (
  owner_id = auth.uid()
  or public.is_operator()
  or exists (
    select 1 from public.memberships m
    where m.owner_id = incidents.owner_id
      and m.contact_id = auth.uid()
      and m.status = 'accepted'
  )
);

-- Tighten UPDATE: only the owner (resolve/cancel own) or an operator.
drop policy if exists incidents_update_auth on public.incidents;
create policy incidents_update_owner_or_operator on public.incidents
for update to authenticated
using      (owner_id = auth.uid() or public.is_operator())
with check (owner_id = auth.uid() or public.is_operator());

-- ---------------------------------------------------------------------------
-- incident_events: readable if you can read the parent incident; you may
-- only write events AS yourself.
-- ---------------------------------------------------------------------------
drop policy if exists events_read on public.incident_events;
create policy events_read_party on public.incident_events
for select to authenticated using (
  public.is_operator()
  or exists (
    select 1 from public.incidents i
    where i.id = incident_events.incident_id
      and ( i.owner_id = auth.uid()
         or exists (
              select 1 from public.memberships m
              where m.owner_id = i.owner_id
                and m.contact_id = auth.uid()
                and m.status = 'accepted'
         ) )
  )
);

drop policy if exists events_insert_auth on public.incident_events;
create policy events_insert_self on public.incident_events
for insert to authenticated with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- invites: owner-only read. Preview + accept go through SECURITY DEFINER
-- functions so an invitee never needs to read the invites table.
-- ---------------------------------------------------------------------------
drop policy if exists invites_read on public.invites;
create policy invites_read_own on public.invites
for select to authenticated using (owner_id = auth.uid());

create or replace function public.preview_invite(p_code text)
returns table(owner_id uuid, owner_name text)
language sql stable security definer set search_path = public as $$
  select i.owner_id, i.owner_name
  from public.invites i
  where i.code = p_code
  limit 1;
$$;
revoke all on function public.preview_invite(text) from public;
grant execute on function public.preview_invite(text) to authenticated;

create or replace function public.accept_invite(p_code text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_owner uuid;
  v_mid   text;
begin
  select owner_id into v_owner from public.invites where code = p_code limit 1;
  if v_owner is null then
    raise exception 'invalid invite';
  end if;
  if v_owner = auth.uid() then
    raise exception 'cannot accept your own invite';
  end if;
  v_mid := 'm_' || substr(v_owner::text, 1, 8) || '_' || substr(auth.uid()::text, 1, 8);
  insert into public.memberships(id, owner_id, contact_id, status, ord)
  values (v_mid, v_owner, auth.uid(), 'accepted', 1)
  on conflict (id) do update set status = 'accepted';
end;
$$;
revoke all on function public.accept_invite(text) from public;
grant execute on function public.accept_invite(text) to authenticated;
