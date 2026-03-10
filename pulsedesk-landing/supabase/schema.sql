-- ============================================================
-- PulseDesk — Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Seguro para re-ejecutar (usa IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- 1. Extensión para UUIDs
create extension if not exists "pgcrypto";

-- 2. Tabla de perfiles (vinculada a auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'agent' check (role in ('agent', 'supervisor', 'admin')),
  created_at  timestamptz default now()
);

-- Agregar columna role si no existe (por si profiles ya existía sin ella)
alter table public.profiles add column if not exists role text not null default 'agent'
  check (role in ('agent', 'supervisor', 'admin'));

-- Crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Campañas
create table if not exists public.campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

insert into public.campaigns (name)
  select unnest(array['Cobranza','Ventas','Soporte'])
  where not exists (select 1 from public.campaigns limit 1);

-- 4. Contactos
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  display_id  text unique,
  name        text not null,
  phone       text,
  campaign_id uuid references public.campaigns(id),
  status      text not null default 'nuevo' check (status in ('nuevo', 'en proceso', 'cerrado')),
  agent_id    uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Secuencia para display_id tipo C-XXXX
create sequence if not exists contact_seq start 1001;

create or replace function public.set_contact_display_id()
returns trigger as $$
begin
  if new.display_id is null then
    new.display_id := 'C-' || nextval('contact_seq')::text;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_insert_contact on public.contacts;
create trigger before_insert_contact
  before insert on public.contacts
  for each row execute procedure public.set_contact_display_id();

-- 5. Interacciones (historial)
create table if not exists public.interactions (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  agent_id    uuid references public.profiles(id),
  type        text not null,
  note        text,
  created_at  timestamptz default now()
);

-- Actualizar updated_at y status en contacts al insertar interacción
create or replace function public.touch_contact_on_interaction()
returns trigger as $$
begin
  update public.contacts
  set updated_at = now(), status =
    case
      when new.type = 'Cierre' then 'cerrado'
      when status = 'nuevo' then 'en proceso'
      else status
    end
  where id = new.contact_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists after_insert_interaction on public.interactions;
create trigger after_insert_interaction
  after insert on public.interactions
  for each row execute procedure public.touch_contact_on_interaction();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table public.profiles     enable row level security;
alter table public.campaigns    enable row level security;
alter table public.contacts     enable row level security;
alter table public.interactions enable row level security;

-- Profiles
drop policy if exists "Perfil propio" on public.profiles;
create policy "Perfil propio" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Admin ve todos los perfiles" on public.profiles;
create policy "Admin ve todos los perfiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Campaigns
drop policy if exists "Leer campañas" on public.campaigns;
create policy "Leer campañas" on public.campaigns
  for select using (auth.role() = 'authenticated');

-- Contacts
drop policy if exists "Agente ve sus contactos" on public.contacts;
create policy "Agente ve sus contactos" on public.contacts
  for select using (
    agent_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
  );

drop policy if exists "Insertar contacto" on public.contacts;
create policy "Insertar contacto" on public.contacts
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Actualizar contacto" on public.contacts;
create policy "Actualizar contacto" on public.contacts
  for update using (
    agent_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('supervisor','admin'))
  );

-- Interactions
drop policy if exists "Ver interacciones" on public.interactions;
create policy "Ver interacciones" on public.interactions
  for select using (
    agent_id = auth.uid() or
    exists (
      select 1 from public.contacts c
      join public.profiles p on p.id = auth.uid()
      where c.id = contact_id and p.role in ('supervisor','admin')
    )
  );

drop policy if exists "Insertar interacción" on public.interactions;
create policy "Insertar interacción" on public.interactions
  for insert with check (auth.role() = 'authenticated');
