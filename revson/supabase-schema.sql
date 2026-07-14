-- ============================================================
-- REVSON SERVICES - Supabase schema
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

create table if not exists businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null,
  address text,
  phone text,
  email text,
  owner_name text,
  ein text,
  owner_user_id uuid references auth.users(id) on delete set null,
  brand_color text default '#4F46E5',
  subscription text default 'trial' check (subscription in ('trial','starter','pro','business')),
  mrr integer default 0,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null check (role in ('super_admin','owner','employee')),
  business_id uuid references businesses(id) on delete set null,
  employee_id uuid,
  created_at timestamptz default now()
);

create table if not exists employees (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text,
  rate numeric default 0,
  phone text,
  status text default 'active' check (status in ('active','invited','inactive')),
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  file_name text,
  file_url text,
  uploaded_by uuid references auth.users(id) on delete set null,
  risk_score integer,
  summary text,
  money jsonb,
  traps jsonb,
  dates jsonb,
  created_at timestamptz default now()
);

create table if not exists pay_periods (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  week_start date not null,
  hours jsonb,
  total_hours numeric,
  ot_hours numeric,
  total_pay numeric,
  status text default 'pending' check (status in ('pending','approved','paid')),
  created_at timestamptz default now()
);

create table if not exists shifts (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  start_time text,
  end_time text,
  role text,
  created_at timestamptz default now()
);

create table if not exists job_posts (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text,
  pay_range text,
  content text,
  interview_questions jsonb,
  status text default 'draft' check (status in ('draft','live')),
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  original_text text,
  stars integer,
  customer_name text,
  response_text text,
  short_response text,
  internal_note text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  assigned_to uuid references employees(id) on delete set null,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  tool text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- HELPER FUNCTIONS (security definer so RLS policies do not recurse)
-- ------------------------------------------------------------

create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.app_business_id()
returns uuid language sql stable security definer set search_path = public as
$$ select business_id from public.profiles where id = auth.uid() $$;

create or replace function public.app_employee_id()
returns uuid language sql stable security definer set search_path = public as
$$ select employee_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin') $$;

create or replace function public.owns_business(b uuid)
returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.businesses where id = b and owner_user_id = auth.uid()) $$;

-- ------------------------------------------------------------
-- TRIGGERS
-- ------------------------------------------------------------

-- Keep businesses.mrr in sync with the subscription plan.
create or replace function public.set_business_mrr()
returns trigger language plpgsql as $$
begin
  new.mrr := case new.subscription
    when 'starter' then 49
    when 'pro' then 149
    when 'business' then 299
    else 0
  end;
  return new;
end $$;

drop trigger if exists businesses_set_mrr on businesses;
create trigger businesses_set_mrr
before insert or update of subscription on businesses
for each row execute function public.set_business_mrr();

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table businesses  enable row level security;
alter table profiles    enable row level security;
alter table employees   enable row level security;
alter table documents   enable row level security;
alter table pay_periods enable row level security;
alter table shifts      enable row level security;
alter table job_posts   enable row level security;
alter table reviews     enable row level security;
alter table tasks       enable row level security;
alter table waitlist    enable row level security;

-- profiles
create policy "profiles_self_select" on profiles for select
  using (id = auth.uid() or is_super_admin());
create policy "profiles_self_update" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on profiles for all
  using (is_super_admin()) with check (is_super_admin());

-- businesses
create policy "biz_admin_all" on businesses for all
  using (is_super_admin()) with check (is_super_admin());
create policy "biz_owner_select" on businesses for select
  using (owner_user_id = auth.uid());
create policy "biz_owner_update" on businesses for update
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "biz_owner_delete" on businesses for delete
  using (owner_user_id = auth.uid());
create policy "biz_owner_insert" on businesses for insert
  with check (owner_user_id = auth.uid());
create policy "biz_member_select" on businesses for select
  using (id = app_business_id());

-- employees
create policy "emp_owner_all" on employees for all
  using (is_super_admin() or owns_business(business_id))
  with check (is_super_admin() or owns_business(business_id));
create policy "emp_member_select" on employees for select
  using (business_id = app_business_id());
create policy "emp_self_update" on employees for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- documents
create policy "doc_owner_all" on documents for all
  using (is_super_admin() or owns_business(business_id))
  with check (is_super_admin() or owns_business(business_id));
create policy "doc_member_select" on documents for select
  using (business_id = app_business_id());

-- pay_periods
create policy "pp_owner_all" on pay_periods for all
  using (is_super_admin() or owns_business(business_id))
  with check (is_super_admin() or owns_business(business_id));
create policy "pp_employee_select" on pay_periods for select
  using (employee_id = app_employee_id());

-- shifts
create policy "shift_owner_all" on shifts for all
  using (is_super_admin() or owns_business(business_id))
  with check (is_super_admin() or owns_business(business_id));
create policy "shift_employee_select" on shifts for select
  using (employee_id = app_employee_id());

-- job_posts
create policy "job_owner_all" on job_posts for all
  using (is_super_admin() or owns_business(business_id))
  with check (is_super_admin() or owns_business(business_id));

-- reviews
create policy "review_owner_all" on reviews for all
  using (is_super_admin() or owns_business(business_id))
  with check (is_super_admin() or owns_business(business_id));

-- tasks
create policy "task_owner_all" on tasks for all
  using (is_super_admin() or owns_business(business_id))
  with check (is_super_admin() or owns_business(business_id));
create policy "task_member_select" on tasks for select
  using (business_id = app_business_id());
create policy "task_member_update" on tasks for update
  using (business_id = app_business_id() and (assigned_to is null or assigned_to = app_employee_id()))
  with check (business_id = app_business_id() and (assigned_to is null or assigned_to = app_employee_id()));

-- waitlist (public capture from the marketing site)
create policy "waitlist_insert_any" on waitlist for insert
  to anon, authenticated with check (true);
create policy "waitlist_admin_select" on waitlist for select
  using (is_super_admin());

-- ------------------------------------------------------------
-- STORAGE (lease PDFs)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "docs_bucket_insert" on storage.objects for insert
  to authenticated with check (bucket_id = 'documents');
create policy "docs_bucket_select" on storage.objects for select
  using (bucket_id = 'documents');
create policy "docs_bucket_delete" on storage.objects for delete
  to authenticated using (bucket_id = 'documents');

-- ------------------------------------------------------------
-- BOOTSTRAP YOUR SUPER ADMIN (run after creating the user)
-- ------------------------------------------------------------
-- 1) Supabase Dashboard -> Authentication -> Users -> Add user (email + password, auto-confirm)
-- 2) Copy the user's UUID and run:
--
-- insert into profiles (id, email, name, role)
-- values ('<AUTH_USER_UUID>', 'you@example.com', 'Super Admin', 'super_admin');
