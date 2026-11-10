-- Beacon — per-invitee invites with pending → accepted tracking (BCN-21)
-- Each invite is now single-use and names who it's for, so the sender can see
-- which invites are still pending and which have been accepted.

alter table public.invites
  add column if not exists label text,
  add column if not exists accepted_at timestamptz,
  add column if not exists accepted_by uuid references auth.users(id);

comment on column public.invites.label is 'Optional name the sender gave this invite (who it is for), shown in their pending list.';
comment on column public.invites.accepted_at is 'When this invite was accepted; null means still pending.';
comment on column public.invites.accepted_by is 'The user who accepted this invite.';

-- preview_invite now also reports whether the invite was already used
drop function if exists public.preview_invite(text);
create function public.preview_invite(p_code text)
 returns table(owner_id uuid, owner_name text, accepted boolean)
 language sql stable security definer set search_path to 'public'
as $function$
  select i.owner_id, i.owner_name, (i.accepted_at is not null) as accepted
  from public.invites i where i.code = p_code limit 1;
$function$;

-- accept_invite consumes a single-use invite and records who accepted and when
create or replace function public.accept_invite(p_code text)
 returns void
 language plpgsql security definer set search_path to 'public'
as $function$
declare v_owner uuid; v_accepted timestamptz; v_mid text;
begin
  select owner_id, accepted_at into v_owner, v_accepted from public.invites where code = p_code limit 1;
  if v_owner is null then raise exception 'invalid invite'; end if;
  if v_owner = auth.uid() then raise exception 'cannot accept your own invite'; end if;
  if v_accepted is not null then raise exception 'invite already used'; end if;
  v_mid := 'm_' || substr(v_owner::text,1,8) || '_' || substr(auth.uid()::text,1,8);
  insert into public.memberships(id, owner_id, contact_id, status, ord)
    values (v_mid, v_owner, auth.uid(), 'accepted', 1)
    on conflict (id) do update set status = 'accepted';
  update public.invites set accepted_at = now(), accepted_by = auth.uid() where code = p_code;
end; $function$;
