-- ========================================================
-- DO-DAILY: SUPABASE INITIAL DATABASE SCHEMA & RLS
-- ========================================================

-- 1. ENUMS
do $$ begin
    create type public.task_category as enum ('health', 'study', 'personal');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type public.task_status as enum ('pending', 'completed', 'failed');
exception
    when duplicate_object then null;
end $$;

-- 2. PROFILES TABLE (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Пользователь',
  email text,
  bio text default '',
  avatar_emoji text not null default '⚡',
  daily_goal int not null default 5 check (daily_goal > 0 and daily_goal <= 50),
  notifications_enabled boolean not null default true,
  sounds_enabled boolean not null default true,
  expo_push_token text,
  xp int not null default 0,
  streak int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_email on public.profiles(email);

-- 3. TASKS TABLE
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  category public.task_category not null default 'study',
  status public.task_status not null default 'pending',
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_task_dates check (end_at >= start_at)
);

create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_start_at on public.tasks(start_at);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);

-- 4. ACHIEVEMENTS SYSTEM
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  color text not null,
  target_count int not null
);

create table if not exists public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Seed default achievements
insert into public.achievements (id, title, description, icon, color, target_count)
values
  ('first_step', 'Первый шаг', 'Выполните хотя бы 1 задачу', 'rocket-outline', '#7557E8', 1),
  ('on_fire', 'В ударе', 'Выполните 5 задач', 'flame-outline', '#FF6B00', 5),
  ('scholar', 'Знаток', 'Завершите 3 задачи в сфере учёбы', 'school-outline', '#18A765', 3),
  ('champion', 'Чемпион', 'Выполните 10 любых задач', 'trophy-outline', '#E78A20', 10)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  color = excluded.color,
  target_count = excluded.target_count;

-- 5. AUTOMATIC TRIGGERS

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_emoji)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    '⚡'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.update_updated_at_column();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Profiles policies
drop policy if exists "Profiles select policy" on public.profiles;
create policy "Profiles select policy"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles update policy" on public.profiles;
create policy "Profiles update policy"
  on public.profiles for update
  using (auth.uid() = id);

-- Tasks policies
drop policy if exists "Tasks select policy" on public.tasks;
create policy "Tasks select policy"
  on public.tasks for select
  using (auth.uid() = user_id);

drop policy if exists "Tasks insert policy" on public.tasks;
create policy "Tasks insert policy"
  on public.tasks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Tasks update policy" on public.tasks;
create policy "Tasks update policy"
  on public.tasks for update
  using (auth.uid() = user_id);

drop policy if exists "Tasks delete policy" on public.tasks;
create policy "Tasks delete policy"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Achievements policies
drop policy if exists "Achievements public read" on public.achievements;
create policy "Achievements public read"
  on public.achievements for select
  using (true);

drop policy if exists "User achievements select policy" on public.user_achievements;
create policy "User achievements select policy"
  on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "User achievements insert policy" on public.user_achievements;
create policy "User achievements insert policy"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

