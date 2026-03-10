-- ============================================================
-- PulseDesk — Fix RLS recursion + políticas correctas
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Función helper que obtiene el rol del usuario actual
-- SECURITY DEFINER = bypassa RLS para leer la propia fila, sin recursión
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- Reemplazar TODAS las políticas que causaban recursión
-- ============================================================

-- PROFILES --------------------------------------------------
drop policy if exists "Perfil propio" on public.profiles;
drop policy if exists "Admin ve todos los perfiles" on public.profiles;
drop policy if exists "Supervisor ve perfiles" on public.profiles;
drop policy if exists "Admin actualiza roles" on public.profiles;

-- Leer: cada quien ve el suyo; supervisor/admin ven todos
create policy "profiles_select" on public.profiles
  for select using (
    auth.uid() = id or get_my_role() in ('supervisor', 'admin')
  );

-- Actualizar: solo admin puede cambiar roles
create policy "profiles_update" on public.profiles
  for update using (
    auth.uid() = id or get_my_role() = 'admin'
  );

-- CAMPAIGNS -------------------------------------------------
drop policy if exists "Leer campañas" on public.campaigns;
drop policy if exists "campaigns_select" on public.campaigns;
drop policy if exists "campaigns_insert" on public.campaigns;
drop policy if exists "campaigns_update" on public.campaigns;

create policy "campaigns_select" on public.campaigns
  for select using (auth.uid() is not null);

create policy "campaigns_insert" on public.campaigns
  for insert with check (get_my_role() in ('supervisor', 'admin'));

create policy "campaigns_update" on public.campaigns
  for update using (get_my_role() = 'admin');

-- CONTACTS --------------------------------------------------
drop policy if exists "Agente ve sus contactos" on public.contacts;
drop policy if exists "Insertar contacto" on public.contacts;
drop policy if exists "Actualizar contacto" on public.contacts;
drop policy if exists "contacts_select" on public.contacts;
drop policy if exists "contacts_insert" on public.contacts;
drop policy if exists "contacts_update" on public.contacts;
drop policy if exists "contacts_delete" on public.contacts;

-- Agente ve los suyos; supervisor/admin ven todos
create policy "contacts_select" on public.contacts
  for select using (
    agent_id = auth.uid() or get_my_role() in ('supervisor', 'admin')
  );

create policy "contacts_insert" on public.contacts
  for insert with check (auth.uid() is not null);

create policy "contacts_update" on public.contacts
  for update using (
    agent_id = auth.uid() or get_my_role() in ('supervisor', 'admin')
  );

create policy "contacts_delete" on public.contacts
  for delete using (get_my_role() = 'admin');

-- INTERACTIONS ----------------------------------------------
drop policy if exists "Ver interacciones" on public.interactions;
drop policy if exists "Insertar interacción" on public.interactions;
drop policy if exists "interactions_select" on public.interactions;
drop policy if exists "interactions_insert" on public.interactions;

create policy "interactions_select" on public.interactions
  for select using (
    agent_id = auth.uid() or get_my_role() in ('supervisor', 'admin')
  );

create policy "interactions_insert" on public.interactions
  for insert with check (auth.uid() is not null);
